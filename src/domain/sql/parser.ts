import type {
  Alias,
  BinaryOperator,
  ComparisonOperator,
  Condition,
  Expression,
  OrderByClause,
  OrderItem,
  SelectItem,
  SelectStatement,
  WhereClause,
} from './ast';
import {
  diagnostic,
  futureMessage,
  type DiagnosticCategory,
  type DiagnosticCode,
  type DiagnosticFix,
  type SqlDiagnostic,
} from './diagnostics';
import {
  CLAUSE_KEYWORDS,
  FORBIDDEN_STATEMENTS,
  FUNCTION_TOPICS,
  FUTURE_KEYWORDS,
  type FutureFeature,
} from './keywords';
import type { Token } from './lexer';
import type { Span } from './source';

/**
 * Parser de descenso recursivo del subconjunto SELECT v2 (LAB_SPEC). Construye el árbol
 * sintáctico con la precedencia de Oracle y se detiene en el primer error de sintaxis,
 * alcance o seguridad con un diagnóstico pedagógico localizado y, cuando se puede, una
 * corrección posible. Las comprobaciones de catálogo, tipos y alias están en `analyzer.ts`.
 */

export const PARSE_LIMITS = Object.freeze({
  maxItems: 12,
  maxDepth: 8,
  maxInValues: 20,
  maxOrderItems: 6,
});

export interface ParseResult<T> {
  readonly node: T | null;
  readonly diagnostics: readonly SqlDiagnostic[];
}

class ParseFailure extends Error {
  constructor(readonly diagnostic: SqlDiagnostic) {
    super(diagnostic.message);
  }
}

const spanOf = (token: Span): Span => ({ start: token.start, end: token.end });
const between = (first: Span, last: Span): Span => ({ start: first.start, end: last.end });

/** Paquetes y esquemas del sistema de Oracle: su invocación es un riesgo de seguridad. */
const SYSTEM_PACKAGE = /^(DBMS_|UTL_|SYS|CTX_|OWA_|HTP|HTF|APEX_|XDB)/;
const DATE_LITERAL = /^(\d{4})-(\d{2})-(\d{2})$/;
const EXAMPLE_CONDITION = "por ejemplo salario > 3000000 o ciudad = 'Cali'";

/** Mensaje de alcance de una palabra clave futura. */
export function futureKeywordMessage(keyword: string): string {
  return futureMessage(
    FUTURE_KEYWORDS.get(keyword) ?? { label: keyword, level: null, topic: null },
  );
}

function isValidDate(text: string): boolean {
  const match = DATE_LITERAL.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

interface FailExtras {
  readonly fix?: DiagnosticFix;
  readonly future?: FutureFeature;
}

class Parser {
  private index = 0;
  private depth = 0;

  constructor(
    private readonly source: string,
    private readonly tokens: readonly Token[],
    private readonly table = 'EMPLEADOS',
  ) {}

  /* ---------- Utilidades ---------- */

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.index + offset, this.tokens.length - 1)]!;
  }

  private previous(): Token | null {
    return this.index > 0 ? this.tokens[this.index - 1]! : null;
  }

  private advance(): Token {
    const token = this.peek();
    if (token.kind !== 'eof') this.index++;
    return token;
  }

  private is(token: Token, keyword: string): boolean {
    return token.kind === 'identifier' && token.value === keyword;
  }

  private isAny(token: Token, keywords: readonly string[]): boolean {
    return token.kind === 'identifier' && keywords.includes(token.value);
  }

  private isStar(token: Token): boolean {
    return token.kind === 'operator' && token.value === '*';
  }

  private ends(token: Token): boolean {
    return token.kind === 'eof' || token.kind === 'semicolon';
  }

  /** Fin de una condición: final, ORDER BY, cierre de paréntesis o AND/OR. */
  private closesCondition(token: Token): boolean {
    return this.ends(token) || token.kind === 'rparen' || this.isAny(token, ['ORDER', 'AND', 'OR']);
  }

  private text(span: Span): string {
    return this.source.slice(span.start, span.end);
  }

  private fail(
    code: DiagnosticCode,
    category: DiagnosticCategory,
    span: Span,
    message: string,
    hint?: string,
    extras: FailExtras = {},
  ): never {
    throw new ParseFailure(
      diagnostic(this.source, {
        code,
        category,
        span: spanOf(span),
        message,
        ...(hint ? { hint } : {}),
        ...(extras.fix ? { fix: extras.fix } : {}),
        ...(extras.future ? { future: extras.future } : {}),
      }),
    );
  }

  private failFuture(span: Span, feature: FutureFeature, hint?: string): never {
    this.fail('out-of-scope', 'scope', span, futureMessage(feature), hint, { future: feature });
  }

  private describe(token: Token): string {
    return token.kind === 'eof' ? 'el final de la consulta' : `«${token.text}»`;
  }

  /** Inserción de texto justo después de un tramo. */
  private insertAfter(span: Span, text: string): DiagnosticFix {
    return { span: { start: span.end, end: span.end }, text };
  }

  /** Construcciones que se rechazan en cuanto aparecen, estén donde estén. */
  private rejectSpecial(token: Token): void {
    switch (token.kind) {
      case 'block-comment':
        this.fail(
          'out-of-scope',
          'scope',
          token,
          'Los comentarios /* … */ no forman parte de esta unidad.',
          'Usa comentarios de línea que empiecen con --.',
        );
      case 'quoted-identifier':
        if (token.unterminated)
          this.fail('unterminated-quote', 'syntax', token, 'Faltan las comillas dobles de cierre.');
        return;
      case 'string':
        if (token.unterminated)
          this.fail(
            'unterminated-quote',
            'syntax',
            token,
            'Falta la comilla simple que cierra el texto.',
            "Cada texto empieza y termina con una comilla simple, por ejemplo 'Bogotá'.",
          );
        return;
      case 'symbol':
        if (token.text === '%') {
          this.fail(
            'invalid-character',
            'syntax',
            token,
            'El símbolo % es un comodín de LIKE y solo tiene sentido dentro de un patrón entre comillas simples.',
            "Por ejemplo: WHERE nombre LIKE 'A%'.",
          );
        }
        if (token.text === '&') {
          this.fail(
            'invalid-character',
            'syntax',
            token,
            'En SQL, «y» se escribe con la palabra AND, no con &.',
            "Por ejemplo: WHERE ciudad = 'Cali' AND salario > 3000000.",
          );
        }
        if (token.text === '!' || token.text === '^') {
          this.fail(
            'invalid-operator',
            'syntax',
            token,
            `El símbolo ${token.text} solo no es un operador: «distinto de» se escribe <> o !=.`,
          );
        }
        if (token.text === '|') {
          this.fail(
            'invalid-operator',
            'syntax',
            token,
            'Una barra | sola no es un operador: para unir textos escribe ||, y para «o», OR.',
          );
        }
        this.fail(
          'invalid-character',
          'syntax',
          token,
          `El símbolo ${token.text} no forma parte del subconjunto SELECT de esta unidad.`,
        );
      default:
        return;
    }
  }

  /** Token que puede empezar un elemento de una lista (columna, número, texto…). */
  private startsElement(token: Token): boolean {
    if (
      token.kind === 'number' ||
      token.kind === 'string' ||
      token.kind === 'lparen' ||
      token.kind === 'quoted-identifier'
    ) {
      return true;
    }
    if (token.kind !== 'identifier') return false;
    return this.is(token, 'NULL') || !CLAUSE_KEYWORDS.has(token.value);
  }

  /* ---------- Sentencia ---------- */

  parseStatement(): SelectStatement {
    const comment = this.tokens.find((token) => token.kind === 'block-comment');
    if (comment) this.rejectSpecial(comment);
    const first = this.peek();
    if (first.kind === 'eof') {
      this.fail(
        'empty',
        'syntax',
        first,
        'La consulta está vacía.',
        'Escribe una consulta que comience con SELECT, por ejemplo SELECT nombre FROM empleados;',
      );
    }
    if (first.kind === 'identifier' && FORBIDDEN_STATEMENTS.has(first.value)) {
      this.failStatement(first, FORBIDDEN_STATEMENTS.get(first.value)!);
    }
    if (this.is(first, 'WITH')) this.failFuture(first, FUTURE_KEYWORDS.get('WITH')!);
    if (!this.is(first, 'SELECT')) {
      const hint = 'Por ejemplo: SELECT nombre FROM empleados;';
      if (this.isAny(first, ['FROM', 'WHERE', 'ORDER'])) {
        this.fail(
          'missing-select',
          'syntax',
          first,
          'Falta SELECT: una consulta primero indica qué columnas mostrar y después, con FROM, de qué tabla salen.',
          hint,
        );
      }
      // «nombre FROM empleados»: la lista de columnas está, solo falta la palabra SELECT.
      const listBeforeFrom =
        first.kind === 'identifier' && this.tokens.some((token) => this.is(token, 'FROM'));
      this.fail(
        'missing-select',
        'syntax',
        first,
        `La consulta debe comenzar con SELECT, no con ${this.describe(first)}.`,
        hint,
        listBeforeFrom
          ? { fix: { span: { start: first.start, end: first.start }, text: 'SELECT ' } }
          : {},
      );
    }
    const selectKeyword = spanOf(this.advance());

    let distinct: Span | null = null;
    const modifier = this.peek();
    if (this.is(modifier, 'DISTINCT')) distinct = spanOf(this.advance());
    else if (this.is(modifier, 'UNIQUE')) {
      this.fail(
        'out-of-scope',
        'scope',
        modifier,
        'UNIQUE después de SELECT es un sinónimo de DISTINCT en Oracle; en esta plataforma se escribe DISTINCT.',
        undefined,
        { fix: { span: spanOf(modifier), text: 'DISTINCT' } },
      );
    } else if (this.is(modifier, 'ALL')) {
      this.fail(
        'out-of-scope',
        'scope',
        modifier,
        'ALL después de SELECT es válido en Oracle y es el comportamiento por defecto (conservar repetidas): en esta unidad se omite.',
        undefined,
        { fix: { span: { start: modifier.start, end: this.peek(1).start }, text: '' } },
      );
    }

    const { items, commas } = this.parseSelectList();
    const fromToken = this.peek();
    if (!this.is(fromToken, 'FROM')) this.failMissingFrom(fromToken, items);
    const fromKeyword = spanOf(this.advance());
    const table = this.parseTable();

    let where: WhereClause | null = null;
    let orderBy: OrderByClause | null = null;
    for (;;) {
      const token = this.peek();
      if (this.ends(token)) break;
      if (this.is(token, 'WHERE')) {
        if (where) {
          this.fail(
            'misplaced-clause',
            'syntax',
            token,
            'Una consulta tiene un solo WHERE: une las condiciones con AND u OR.',
            undefined,
            { fix: { span: spanOf(token), text: 'AND' } },
          );
        }
        if (orderBy) {
          this.fail(
            'misplaced-clause',
            'syntax',
            token,
            'WHERE va antes de ORDER BY: primero se eligen las filas y después se ordenan.',
            'Orden de escritura: SELECT … FROM … WHERE … ORDER BY …',
          );
        }
        where = this.parseWhere();
      } else if (this.is(token, 'ORDER')) {
        if (orderBy) {
          this.fail(
            'misplaced-clause',
            'syntax',
            token,
            'Una consulta tiene un solo ORDER BY: separa los criterios con comas.',
          );
        }
        orderBy = this.parseOrderBy();
      } else {
        this.failAfterTable(token, where !== null || orderBy !== null);
      }
    }

    let terminator: Span | null = null;
    if (this.peek().kind === 'semicolon') {
      terminator = spanOf(this.advance());
      const rest = this.peek();
      if (rest.kind !== 'eof') {
        this.rejectSpecial(rest);
        this.fail(
          'multiple-statements',
          'security',
          rest,
          'Después del punto y coma hay otra sentencia: se admite una sola consulta y ninguna de las dos se envía al motor.',
        );
      }
    }
    const last = terminator ?? orderBy?.items.at(-1)?.span ?? where?.condition.span ?? table.span;
    return {
      kind: 'select',
      selectKeyword,
      distinct,
      items,
      commas,
      fromKeyword,
      table,
      where,
      orderBy,
      terminator,
      span: { start: selectKeyword.start, end: last.end },
    };
  }

  private failStatement(token: Token, feature: FutureFeature): never {
    const level =
      feature.level === 6
        ? ' y se estudia en el Nivel 6 (Modificar datos) de esta plataforma'
        : feature.level === 7
          ? ' y se estudia en el Nivel 7 (Estructura de datos) de esta plataforma'
          : '';
    const kind = feature.level === null ? 'no es una consulta' : `es SQL válido en Oracle${level}`;
    this.fail(
      'statement-not-allowed',
      'security',
      token,
      `${token.value} ${kind}. Este laboratorio solo lee datos: la sentencia no se envía al motor.`,
      'Aquí se escriben consultas que empiezan con SELECT.',
      feature.level === null ? {} : { future: feature },
    );
  }

  private failMissingFrom(token: Token, items: readonly SelectItem[]): never {
    this.rejectSpecial(token);
    const last = items.at(-1);
    if (
      last?.kind === 'expression' &&
      last.alias &&
      !last.alias.explicit &&
      !last.alias.quoted &&
      last.alias.header === this.table
    ) {
      this.fail(
        'missing-from',
        'syntax',
        last.alias.span,
        `Falta FROM antes de ${last.alias.raw}: sin FROM, ${last.alias.raw} se lee como un alias de ${this.text(last.expression.span)} y la consulta no dice de qué tabla salen los datos.`,
        undefined,
        { fix: { span: last.alias.span, text: `FROM ${last.alias.raw}` } },
      );
    }
    if (this.ends(token)) {
      const anchor = this.previous() ?? token;
      this.fail(
        'missing-from',
        'syntax',
        token.kind === 'eof' ? anchor : token,
        'Falta FROM: después de las columnas indica de qué tabla salen los datos.',
        'Por ejemplo: … FROM empleados;',
        { fix: this.insertAfter(anchor, ' FROM empleados') },
      );
    }
    if (this.isAny(token, ['WHERE', 'ORDER'])) {
      this.fail(
        'missing-from',
        'syntax',
        token,
        `Falta FROM antes de ${token.text}: la tabla se indica justo después de las columnas.`,
        'Orden de escritura: SELECT … FROM … WHERE … ORDER BY …',
        { fix: { span: { start: token.start, end: token.start }, text: 'FROM empleados ' } },
      );
    }
    if (this.is(token, 'DISTINCT'))
      this.fail(
        'misplaced-keyword',
        'syntax',
        token,
        'DISTINCT va inmediatamente después de SELECT.',
      );
    if (token.kind === 'identifier' && FUTURE_KEYWORDS.has(token.value)) {
      this.fail(
        'missing-from',
        'syntax',
        token,
        `Falta FROM antes de ${token.text}: la tabla se indica justo después de las columnas.`,
        futureKeywordMessage(token.value),
      );
    }
    if (token.kind === 'rparen')
      this.fail('unbalanced-parentheses', 'syntax', token, 'Sobra un paréntesis de cierre.');
    this.fail(
      'unexpected-token',
      'syntax',
      token,
      `No se esperaba ${this.describe(token)} en la lista de columnas.`,
      'Separa las columnas con comas y termina la lista con FROM.',
    );
  }

  /* ---------- Lista de SELECT ---------- */

  private parseSelectList(): { items: SelectItem[]; commas: Span[] } {
    const first = this.peek();
    if (this.is(first, 'FROM')) {
      this.fail(
        'empty-select-list',
        'syntax',
        first,
        'Falta la lista de columnas entre SELECT y FROM.',
        'Escribe las columnas que quieres mostrar, o * para todas.',
        { fix: { span: { start: first.start, end: first.start }, text: 'nombre ' } },
      );
    }
    if (this.ends(first))
      this.fail(
        'empty-select-list',
        'syntax',
        this.previous() ?? first,
        'Después de SELECT escribe las columnas que quieres mostrar.',
      );
    if (first.kind === 'comma') {
      this.fail(
        'missing-item',
        'syntax',
        first,
        'Hay una coma antes de la primera columna: la lista empieza directamente con una columna o expresión.',
        undefined,
        { fix: { span: spanOf(first), text: '' } },
      );
    }
    const items: SelectItem[] = [];
    const commas: Span[] = [];
    for (;;) {
      items.push(this.parseItem(items.length > 0));
      if (items.length > PARSE_LIMITS.maxItems) {
        this.fail(
          'too-many-items',
          'limit',
          items.at(-1)!.span,
          `La lista tiene más de ${PARSE_LIMITS.maxItems} elementos, el máximo de este laboratorio.`,
        );
      }
      const separator = this.peek();
      if (separator.kind !== 'comma') return { items, commas };
      commas.push(spanOf(this.advance()));
      const after = this.peek();
      if (this.is(after, 'FROM') || this.ends(after)) {
        this.fail(
          'missing-item-after-comma',
          'syntax',
          separator,
          'Falta una columna o expresión después de la coma.',
          'Cada coma anuncia otro elemento de la lista: bórrala o añade la columna que falta.',
          { fix: { span: spanOf(separator), text: '' } },
        );
      }
      if (after.kind === 'comma')
        this.fail(
          'missing-item',
          'syntax',
          after,
          'Hay dos comas seguidas: falta una columna entre ellas.',
          undefined,
          { fix: { span: spanOf(after), text: '' } },
        );
    }
  }

  private parseItem(afterComma: boolean): SelectItem {
    const token = this.peek();
    if (this.isStar(token)) {
      const after = this.peek(1);
      if (afterComma || after.kind === 'comma') {
        this.fail(
          'star-mixed',
          'oracle',
          token,
          'En Oracle, el asterisco sin indicar la tabla no se combina con otras columnas: * ya representa todas.',
          'Usa * solo, o escribe la lista de columnas que necesitas.',
        );
      }
      if (this.is(after, 'FROM') || this.ends(after)) {
        this.advance();
        return { kind: 'star', span: spanOf(token) };
      }
      if (
        this.is(after, 'AS') ||
        after.kind === 'identifier' ||
        after.kind === 'quoted-identifier'
      ) {
        this.fail(
          'star-alias',
          'syntax',
          after,
          'El asterisco no admite alias: AS nombra una sola columna o expresión.',
        );
      }
    }
    const expression = this.parseExpression();
    const next = this.peek();
    if (
      next.kind === 'comparison' ||
      this.isAny(next, ['BETWEEN', 'IN', 'LIKE', 'IS']) ||
      (this.is(next, 'NOT') && this.isAny(this.peek(1), ['BETWEEN', 'IN', 'LIKE']))
    ) {
      this.fail(
        'comparison-in-select',
        'syntax',
        next,
        `Las condiciones van en WHERE: después de SELECT se eligen columnas, no se comparan valores.`,
        `Para quedarte con ciertas filas escribe … FROM empleados WHERE ${this.text(expression.span)} ${next.text} …`,
      );
    }
    const alias = this.parseAlias();
    const after = this.peek();
    this.rejectSpecial(after);
    if (
      alias?.explicit &&
      !alias.quoted &&
      after.kind === 'identifier' &&
      !CLAUSE_KEYWORDS.has(after.value)
    ) {
      const name = { start: alias.span.end - alias.raw.length, end: after.end };
      this.fail(
        'invalid-alias',
        'alias',
        name,
        `Un alias sin comillas no puede tener espacios: después de AS ${alias.raw} sigue ${after.text}.`,
        `Únelo con guion bajo (${alias.raw}_${after.text}) o escríbelo entre comillas dobles: AS "${alias.raw} ${after.text}".`,
        { fix: { span: name, text: `${alias.raw}_${after.text}` } },
      );
    }
    if (this.startsElement(after)) {
      const previous = this.previous()!;
      this.fail(
        'missing-comma',
        'syntax',
        after,
        `Falta una coma entre ${previous.text} y ${after.text}.`,
        alias && !alias.explicit
          ? `Sin coma, ${alias.raw} ya se leyó como alias de la columna anterior y ${after.text} no puede seguirle.`
          : 'Separa cada columna o expresión con una coma.',
        { fix: this.insertAfter(previous, ',') },
      );
    }
    if (after.kind === 'rparen')
      this.fail('unbalanced-parentheses', 'syntax', after, 'Sobra un paréntesis de cierre.');
    return {
      kind: 'expression',
      expression,
      alias,
      span: { start: expression.span.start, end: (alias?.span ?? expression.span).end },
    };
  }

  private parseAlias(): Alias | null {
    const token = this.peek();
    if (this.is(token, 'AS')) {
      const keyword = spanOf(this.advance());
      const name = this.peek();
      this.rejectSpecial(name);
      if (name.kind === 'identifier' && !CLAUSE_KEYWORDS.has(name.value)) {
        this.advance();
        return {
          raw: name.text,
          header: name.value,
          quoted: false,
          explicit: true,
          span: { start: keyword.start, end: name.end },
          keywordSpan: keyword,
        };
      }
      if (name.kind === 'quoted-identifier') {
        this.advance();
        return {
          raw: name.value,
          header: name.value,
          quoted: true,
          explicit: true,
          span: { start: keyword.start, end: name.end },
          keywordSpan: keyword,
        };
      }
      if (name.kind === 'string') {
        this.fail(
          'invalid-alias',
          'alias',
          name,
          'Un alias con espacios o tildes va entre comillas dobles, no simples: las comillas simples son para textos.',
          undefined,
          { fix: { span: spanOf(name), text: `"${name.value.replaceAll('"', '')}"` } },
        );
      }
      if (name.kind === 'identifier' && name.value !== 'FROM') {
        this.fail(
          'invalid-alias',
          'alias',
          name,
          `${name.text} es una palabra reservada y no puede usarse como alias sin comillas.`,
          'Elige otro nombre o escríbelo entre comillas dobles.',
        );
      }
      if (name.kind === 'number') {
        this.fail(
          'invalid-alias',
          'alias',
          name,
          `Un alias no puede empezar por un número (${name.text}).`,
          'Empieza con una letra, por ejemplo salario_anual.',
        );
      }
      this.fail(
        'invalid-alias',
        'alias',
        keyword,
        'AS debe ir seguido del nombre del encabezado.',
        'Por ejemplo: salario * 12 AS salario_anual.',
      );
    }
    if (token.kind === 'identifier' && !CLAUSE_KEYWORDS.has(token.value)) {
      // «nombre DATE '…'» o «nombre UPPER(…)» no son alias: son otro elemento sin coma.
      const after = this.peek(1);
      if (after.kind === 'lparen' || (this.is(token, 'DATE') && after.kind === 'string')) {
        return null;
      }
      this.advance();
      return {
        raw: token.text,
        header: token.value,
        quoted: false,
        explicit: false,
        span: spanOf(token),
        keywordSpan: null,
      };
    }
    if (token.kind === 'quoted-identifier') {
      this.rejectSpecial(token);
      this.advance();
      return {
        raw: token.value,
        header: token.value,
        quoted: true,
        explicit: false,
        span: spanOf(token),
        keywordSpan: null,
      };
    }
    return null;
  }

  /* ---------- Origen ---------- */

  private parseTable(): SelectStatement['table'] {
    const token = this.peek();
    this.rejectSpecial(token);
    const tableFix = (at: Span) => ({ fix: this.insertAfter(at, ' empleados') });
    if (this.ends(token)) {
      const anchor = this.previous() ?? token;
      this.fail(
        'missing-table',
        'syntax',
        anchor,
        'Después de FROM escribe el nombre de la tabla: empleados.',
        undefined,
        tableFix(anchor),
      );
    }
    if (token.kind === 'lparen')
      this.failFuture(token, {
        label: 'Usar una subconsulta como origen',
        level: 5,
        topic: 'subconsulta-simple',
      });
    if (token.kind === 'quoted-identifier') {
      this.fail(
        'unknown-table',
        'table',
        token,
        'En este laboratorio la tabla se escribe sin comillas.',
        'Escribe FROM empleados.',
        { fix: { span: spanOf(token), text: 'empleados' } },
      );
    }
    if (this.is(token, 'DUAL')) {
      this.failFuture(
        token,
        FUTURE_KEYWORDS.get('DUAL')!,
        'La tabla de este laboratorio es EMPLEADOS.',
      );
    }
    if (token.kind !== 'identifier' || CLAUSE_KEYWORDS.has(token.value)) {
      this.fail(
        'missing-table',
        'syntax',
        token,
        `Falta el nombre de la tabla después de FROM; se encontró ${this.describe(token)}.`,
        'Escribe FROM empleados.',
        tableFix(this.previous() ?? token),
      );
    }
    if (this.peek(1).kind === 'dot') {
      this.fail(
        'out-of-scope',
        'scope',
        { start: token.start, end: this.peek(1).end },
        'Los nombres con esquema, como hr.empleados, no forman parte de este laboratorio.',
        'Escribe solo FROM empleados.',
      );
    }
    this.advance();
    return { name: token.value, raw: token.text, span: spanOf(token) };
  }

  /** Lo que sigue a la tabla (o a WHERE / ORDER BY) y no es una cláusula admitida. */
  private failAfterTable(token: Token, afterClause: boolean): never {
    this.rejectSpecial(token);
    const join = FUTURE_KEYWORDS.get('JOIN')!;
    if (token.kind === 'comma') {
      this.failFuture(token, { ...join, label: 'Consultar varias tablas a la vez' });
    }
    if (token.kind === 'identifier' && FUTURE_KEYWORDS.has(token.value)) {
      const feature = FUTURE_KEYWORDS.get(token.value)!;
      this.failFuture(
        token,
        feature,
        token.value === 'GROUP' || token.value === 'HAVING'
          ? undefined
          : 'En esta unidad la consulta termina con FROM empleados, WHERE y ORDER BY.',
      );
    }
    const condition =
      token.kind === 'comparison' ||
      this.isAny(this.peek(1), ['BETWEEN', 'IN', 'LIKE', 'IS']) ||
      this.peek(1).kind === 'comparison';
    if (!afterClause && condition && token.kind !== 'rparen') {
      this.fail(
        'missing-condition',
        'syntax',
        token,
        'Falta WHERE antes de la condición: WHERE anuncia qué deben cumplir las filas.',
        undefined,
        { fix: { span: { start: token.start, end: token.start }, text: 'WHERE ' } },
      );
    }
    if (!afterClause && this.is(token, 'AS')) {
      const name = this.peek(1);
      this.fail(
        'table-alias',
        'scope',
        { start: token.start, end: name.end },
        `AS ${name.text} después de la tabla sería un alias de tabla, no de columna. Los alias de tabla se usan al combinar tablas con JOIN (Nivel 4).`,
        'Para nombrar una columna, escribe AS justo después de la columna o expresión.',
        { future: join },
      );
    }
    if (!afterClause && token.kind === 'identifier' && !CLAUSE_KEYWORDS.has(token.value)) {
      this.fail(
        'table-alias',
        'scope',
        token,
        `${token.text} después de la tabla sería un alias de tabla. Los alias de tabla se usan al combinar tablas con JOIN (Nivel 4).`,
        'Escribe solo FROM empleados.',
        { future: join },
      );
    }
    if (token.kind === 'rparen')
      this.fail('unbalanced-parentheses', 'syntax', token, 'Sobra un paréntesis de cierre.');
    this.fail(
      'unexpected-token',
      'syntax',
      token,
      `No se esperaba ${this.describe(token)} en este punto de la consulta.`,
      'Orden de escritura: SELECT … FROM empleados WHERE … ORDER BY …, con un punto y coma opcional.',
    );
  }

  /* ---------- WHERE ---------- */

  private parseWhere(): WhereClause {
    const keyword = spanOf(this.advance());
    const next = this.peek();
    if (this.ends(next) || this.is(next, 'ORDER')) {
      this.fail(
        'missing-condition',
        'syntax',
        keyword,
        'Falta la condición después de WHERE: escribe qué deben cumplir las filas.',
        `Por ejemplo: WHERE ciudad = 'Cali'.`,
      );
    }
    const condition = this.parseOr();
    const after = this.peek();
    if (
      !this.ends(after) &&
      !this.is(after, 'ORDER') &&
      after.kind !== 'rparen' &&
      this.startsElement(after)
    ) {
      this.fail(
        'missing-logical-operator',
        'syntax',
        after,
        'Falta AND u OR entre las dos condiciones.',
        'AND exige que se cumplan ambas; OR, que se cumpla al menos una.',
        { fix: { span: { start: after.start, end: after.start }, text: 'AND ' } },
      );
    }
    if (after.kind === 'rparen')
      this.fail('unbalanced-parentheses', 'syntax', after, 'Sobra un paréntesis de cierre.');
    return { keyword, condition };
  }

  private parseOr(): Condition {
    let left = this.parseAnd();
    while (this.is(this.peek(), 'OR')) {
      const operator = spanOf(this.advance());
      this.requireCondition('OR', operator);
      const right = this.parseAnd();
      left = {
        kind: 'logical',
        operator: 'OR',
        left,
        right,
        operatorSpan: operator,
        span: between(left.span, right.span),
      };
    }
    return left;
  }

  private parseAnd(): Condition {
    let left = this.parseNot();
    while (this.is(this.peek(), 'AND')) {
      const operator = spanOf(this.advance());
      this.requireCondition('AND', operator);
      const right = this.parseNot();
      left = {
        kind: 'logical',
        operator: 'AND',
        left,
        right,
        operatorSpan: operator,
        span: between(left.span, right.span),
      };
    }
    return left;
  }

  private requireCondition(word: string, operator: Span): void {
    const next = this.peek();
    if (this.closesCondition(next)) {
      this.fail(
        'missing-condition',
        'syntax',
        operator,
        `Falta una condición después de ${word}.`,
        `${word} une dos condiciones completas, ${EXAMPLE_CONDITION}.`,
      );
    }
  }

  private parseNot(): Condition {
    const token = this.peek();
    if (this.is(token, 'NOT')) {
      const keyword = spanOf(this.advance());
      if (this.closesCondition(this.peek())) {
        this.fail('missing-condition', 'syntax', keyword, 'Falta la condición después de NOT.');
      }
      const condition = this.parseNot();
      return {
        kind: 'not',
        condition,
        keywordSpan: keyword,
        span: between(keyword, condition.span),
      };
    }
    return this.parsePredicate();
  }

  /** Lo que sigue a `(…)` indica que el paréntesis era parte de una expresión. */
  private continuesExpression(token: Token): boolean {
    return (
      token.kind === 'comparison' ||
      token.kind === 'operator' ||
      token.kind === 'concat' ||
      this.isAny(token, ['BETWEEN', 'IN', 'LIKE', 'IS']) ||
      (this.is(token, 'NOT') && this.isAny(this.peek(1), ['BETWEEN', 'IN', 'LIKE']))
    );
  }

  private parsePredicate(): Condition {
    const token = this.peek();
    if (this.isAny(token, ['AND', 'OR'])) {
      this.fail(
        'missing-condition',
        'syntax',
        token,
        `Falta una condición antes de ${token.text}.`,
        `${token.text} une dos condiciones completas, ${EXAMPLE_CONDITION}.`,
      );
    }
    if (token.kind !== 'lparen') return this.parseSimplePredicate();

    // «(» puede abrir una condición agrupada o una expresión, como (salario + bono) > 5000000.
    const saved = { index: this.index, depth: this.depth };
    let groupFailure: ParseFailure | null = null;
    try {
      const open = this.advance();
      if (this.is(this.peek(), 'SELECT')) this.failSubquery(this.peek());
      this.enter(open);
      const inner = this.parseOr();
      this.depth--;
      const close = this.peek();
      if (close.kind !== 'rparen') {
        this.fail(
          'unbalanced-parentheses',
          'syntax',
          open,
          'Falta cerrar este paréntesis.',
          'Cada ( necesita su ) correspondiente.',
        );
      }
      this.advance();
      if (!this.continuesExpression(this.peek())) {
        return { kind: 'condition-group', condition: inner, span: between(open, close) };
      }
    } catch (error) {
      if (!(error instanceof ParseFailure)) throw error;
      if (error.diagnostic.category === 'scope' || error.diagnostic.category === 'security') {
        throw error;
      }
      groupFailure = error;
    }
    this.index = saved.index;
    this.depth = saved.depth;
    try {
      return this.parseSimplePredicate();
    } catch (error) {
      if (!(error instanceof ParseFailure) || !groupFailure) throw error;
      // Se informa el error que llegó más lejos en el texto.
      throw error.diagnostic.span.start >= groupFailure.diagnostic.span.start
        ? error
        : groupFailure;
    }
  }

  private parseSimplePredicate(): Condition {
    const expression = this.parseExpression();
    const token = this.peek();
    if (token.kind === 'comparison') return this.parseComparison(expression);
    if (this.is(token, 'NOT')) {
      const after = this.peek(1);
      if (this.isAny(after, ['BETWEEN', 'IN', 'LIKE'])) {
        const not = this.advance();
        return this.parseNegatable(expression, true, not);
      }
      if (this.is(after, 'NULL')) {
        this.fail(
          'missing-null',
          'syntax',
          between(token, after),
          'Para comprobar que una columna tiene valor se escribe IS NOT NULL.',
          undefined,
          { fix: { span: between(token, after), text: 'IS NOT NULL' } },
        );
      }
      this.fail(
        'unexpected-token',
        'syntax',
        token,
        'Después de una expresión, NOT solo puede ir seguido de BETWEEN, IN o LIKE.',
        'Para negar una condición completa, escribe NOT al principio: NOT (condición).',
      );
    }
    if (this.isAny(token, ['BETWEEN', 'IN', 'LIKE'])) {
      return this.parseNegatable(expression, false, token);
    }
    if (this.is(token, 'IS')) return this.parseIsNull(expression);
    this.rejectSpecial(token);
    const written = this.text(expression.span);
    if (this.startsElement(token)) {
      this.fail(
        'missing-comparison',
        'syntax',
        token,
        `Falta un operador de comparación entre ${written} y ${token.text}.`,
        'Por ejemplo = (igual), <> (distinto), > o <.',
        { fix: this.insertAfter(expression.span, ' =') },
      );
    }
    this.fail(
      'missing-comparison',
      'syntax',
      expression.span,
      `Falta la comparación: indica qué debe cumplir ${written}.`,
      `Una condición compara valores, ${EXAMPLE_CONDITION}.`,
    );
  }

  private parseComparison(left: Expression): Condition {
    const opToken = this.advance();
    const next = this.peek();
    const adjacent = next.kind === 'comparison' && next.start === opToken.end;
    if (opToken.text === '=' && adjacent) {
      const span = between(opToken, next);
      if (next.text === '=') {
        this.fail(
          'invalid-operator',
          'syntax',
          span,
          'En SQL la igualdad se escribe con un solo =.',
          undefined,
          { fix: { span, text: '=' } },
        );
      }
      const intended = next.text === '>' ? '>=' : next.text === '<' ? '<=' : null;
      if (intended) {
        this.fail(
          'invalid-operator',
          'syntax',
          span,
          `${this.text(span)} no es un operador de SQL: se escribe ${intended}.`,
          undefined,
          { fix: { span, text: intended } },
        );
      }
    }
    if (this.closesCondition(next)) {
      this.fail(
        'incomplete-expression',
        'syntax',
        opToken,
        `Falta el valor que se compara después de ${opToken.text}.`,
        `Por ejemplo: ${this.text(left.span)} ${opToken.text} 3000000.`,
      );
    }
    const right = this.parseExpression();
    const after = this.peek();
    if (after.kind === 'comparison') {
      const concat = right.kind === 'binary' && right.operator === '||';
      this.fail(
        'chained-comparison',
        'syntax',
        after,
        concat
          ? 'En SQL, || une textos; para decir «o» entre dos condiciones se escribe OR.'
          : 'SQL no encadena comparaciones: escribe cada una por separado y únelas con AND.',
        concat
          ? "Por ejemplo: ciudad = 'Cali' OR ciudad = 'Bogotá'."
          : 'Para un rango, BETWEEN es más claro: salario BETWEEN 3000000 AND 6000000.',
      );
    }
    return {
      kind: 'comparison',
      operator: opToken.text as ComparisonOperator,
      left,
      right,
      operatorSpan: spanOf(opToken),
      span: between(left.span, right.span),
    };
  }

  private parseNegatable(expression: Expression, negated: boolean, start: Token): Condition {
    const keywordToken = this.advance();
    const keywordSpan = between(start, keywordToken);
    switch (keywordToken.value) {
      case 'BETWEEN':
        return this.parseBetween(expression, negated, keywordSpan);
      case 'IN':
        return this.parseIn(expression, negated, keywordSpan);
      default:
        return this.parseLike(expression, negated, keywordSpan);
    }
  }

  private parseBetween(expression: Expression, negated: boolean, keywordSpan: Span): Condition {
    if (this.closesCondition(this.peek())) {
      this.fail(
        'missing-between-and',
        'syntax',
        keywordSpan,
        'Faltan los límites del rango: BETWEEN límite_inferior AND límite_superior.',
        'Por ejemplo: salario BETWEEN 3000000 AND 6000000.',
      );
    }
    const low = this.parseExpression();
    const separator = this.peek();
    if (!this.is(separator, 'AND')) {
      if (separator.kind === 'comma') {
        this.fail(
          'missing-between-and',
          'syntax',
          separator,
          'BETWEEN une sus dos límites con AND, no con una coma.',
          undefined,
          { fix: { span: spanOf(separator), text: ' AND' } },
        );
      }
      this.fail(
        'missing-between-and',
        'syntax',
        low.span,
        'Después del límite inferior escribe AND y el límite superior.',
        `Por ejemplo: BETWEEN ${this.text(low.span)} AND 6000000.`,
      );
    }
    const and = this.advance();
    if (this.closesCondition(this.peek())) {
      this.fail(
        'missing-between-and',
        'syntax',
        and,
        'Falta el límite superior después de AND.',
        'BETWEEN necesita dos límites: el menor y el mayor.',
      );
    }
    const high = this.parseExpression();
    return {
      kind: 'between',
      negated,
      expression,
      low,
      high,
      keywordSpan,
      span: between(expression.span, high.span),
    };
  }

  private parseIn(expression: Expression, negated: boolean, keywordSpan: Span): Condition {
    const open = this.peek();
    if (open.kind !== 'lparen') {
      if (this.closesCondition(open)) {
        this.fail(
          'in-without-parentheses',
          'syntax',
          keywordSpan,
          'Falta la lista de valores después de IN.',
          "Por ejemplo: ciudad IN ('Bogotá', 'Cali').",
        );
      }
      let last = open;
      for (let offset = 0; ; offset++) {
        const candidate = this.peek(offset);
        if (this.closesCondition(candidate)) break;
        last = candidate;
      }
      const span = between(open, last);
      const list = this.text(span);
      this.fail(
        'in-without-parentheses',
        'syntax',
        span,
        'IN necesita la lista de valores entre paréntesis.',
        `Escribe IN (${list}).`,
        { fix: { span, text: `(${list})` } },
      );
    }
    this.advance();
    if (this.is(this.peek(), 'SELECT')) this.failSubquery(this.peek(), 'in-subconsulta');
    if (this.peek().kind === 'rparen') {
      this.fail(
        'empty-in-list',
        'syntax',
        between(open, this.peek()),
        'La lista de IN está vacía: escribe al menos un valor.',
        "Por ejemplo: ciudad IN ('Bogotá', 'Cali').",
      );
    }
    const values: Expression[] = [];
    for (;;) {
      values.push(this.parseExpression());
      if (values.length > PARSE_LIMITS.maxInValues) {
        this.fail(
          'too-many-items',
          'limit',
          values.at(-1)!.span,
          `La lista de IN tiene más de ${PARSE_LIMITS.maxInValues} valores, el máximo de este laboratorio.`,
        );
      }
      const token = this.peek();
      if (token.kind !== 'comma') break;
      this.advance();
      if (this.peek().kind === 'rparen') {
        this.fail(
          'missing-item-after-comma',
          'syntax',
          token,
          'Sobra la coma final de la lista de IN.',
          undefined,
          { fix: { span: spanOf(token), text: '' } },
        );
      }
    }
    const close = this.peek();
    if (close.kind !== 'rparen') {
      if (this.startsElement(close)) {
        this.fail(
          'missing-comma',
          'syntax',
          close,
          'Falta una coma entre los valores de la lista de IN.',
          undefined,
          { fix: this.insertAfter(values.at(-1)!.span, ',') },
        );
      }
      this.fail(
        'unbalanced-parentheses',
        'syntax',
        open,
        'Falta cerrar la lista de IN con ).',
        undefined,
        { fix: this.insertAfter(values.at(-1)!.span, ')') },
      );
    }
    this.advance();
    return {
      kind: 'in',
      negated,
      expression,
      values,
      keywordSpan,
      span: between(expression.span, close),
    };
  }

  private parseLike(expression: Expression, negated: boolean, keywordSpan: Span): Condition {
    const first = this.peek();
    if (this.closesCondition(first)) {
      this.fail(
        'like-unquoted-pattern',
        'syntax',
        keywordSpan,
        'Falta el patrón después de LIKE.',
        "Por ejemplo: nombre LIKE 'A%' (empieza por A).",
      );
    }
    if (first.kind === 'identifier' || first.kind === 'symbol' || first.kind === 'number') {
      // Tokens pegados, como A% o %ar%, forman un patrón que olvidó sus comillas.
      let last = first;
      let wildcard = first.text.startsWith('_') || first.text.includes('%');
      for (let offset = 1; ; offset++) {
        const candidate = this.peek(offset);
        const previous = this.peek(offset - 1);
        if (candidate.start !== previous.end || this.closesCondition(candidate)) break;
        if (candidate.kind === 'symbol' || candidate.text.startsWith('_')) wildcard = true;
        last = candidate;
      }
      if (wildcard || last !== first || first.kind === 'symbol') {
        const span = between(first, last);
        const pattern = this.text(span);
        this.fail(
          'like-unquoted-pattern',
          'syntax',
          span,
          'El patrón de LIKE es un texto: va entre comillas simples.',
          '% representa cualquier cantidad de caracteres y _ exactamente uno.',
          { fix: { span, text: `'${pattern}'` } },
        );
      }
    }
    const pattern = this.parseExpression();
    if (this.is(this.peek(), 'ESCAPE'))
      this.failFuture(this.peek(), FUTURE_KEYWORDS.get('ESCAPE')!);
    return {
      kind: 'like',
      negated,
      expression,
      pattern,
      keywordSpan,
      span: between(expression.span, pattern.span),
    };
  }

  private parseIsNull(expression: Expression): Condition {
    const is = this.advance();
    let negated = false;
    if (this.is(this.peek(), 'NOT')) {
      this.advance();
      negated = true;
    }
    const target = this.peek();
    if (!this.is(target, 'NULL')) {
      this.fail(
        'missing-null',
        'syntax',
        between(is, target.kind === 'eof' ? is : target),
        'Después de IS se escribe NULL o NOT NULL.',
        'IS sirve para preguntar si una columna no tiene valor: bono IS NULL.',
        target.kind === 'string' && target.value === ''
          ? { fix: { span: spanOf(target), text: 'NULL' } }
          : {},
      );
    }
    this.advance();
    return {
      kind: 'is-null',
      negated,
      expression,
      keywordSpan: between(is, target),
      span: between(expression.span, target),
    };
  }

  private failSubquery(token: Token, topic = 'subconsulta-where'): never {
    this.failFuture(token, {
      label: 'Una consulta dentro de otra (subconsulta)',
      level: 5,
      topic,
    });
  }

  /* ---------- ORDER BY ---------- */

  private parseOrderBy(): OrderByClause {
    const order = this.advance();
    const by = this.peek();
    if (!this.is(by, 'BY')) {
      this.fail(
        'missing-by',
        'syntax',
        order,
        'Después de ORDER se escribe BY: ORDER BY salario.',
        undefined,
        { fix: this.insertAfter(order, ' BY') },
      );
    }
    this.advance();
    const keyword = between(order, by);
    if (this.ends(this.peek())) {
      this.fail(
        'missing-order-item',
        'syntax',
        keyword,
        'Falta la columna por la que se ordena después de ORDER BY.',
        'Por ejemplo: ORDER BY salario DESC.',
      );
    }
    const items: OrderItem[] = [];
    const commas: Span[] = [];
    for (;;) {
      items.push(this.parseOrderItem());
      if (items.length > PARSE_LIMITS.maxOrderItems) {
        this.fail(
          'too-many-items',
          'limit',
          items.at(-1)!.span,
          `ORDER BY tiene más de ${PARSE_LIMITS.maxOrderItems} criterios, el máximo de este laboratorio.`,
        );
      }
      const token = this.peek();
      if (token.kind !== 'comma') break;
      commas.push(spanOf(this.advance()));
      if (this.ends(this.peek())) {
        this.fail(
          'missing-item-after-comma',
          'syntax',
          token,
          'Falta un criterio de orden después de la coma.',
          undefined,
          { fix: { span: spanOf(token), text: '' } },
        );
      }
    }
    const after = this.peek();
    if (this.startsElement(after)) {
      this.fail(
        'missing-comma',
        'syntax',
        after,
        'Falta una coma entre los criterios de ORDER BY.',
        'Por ejemplo: ORDER BY departamento ASC, salario DESC.',
        { fix: this.insertAfter(items.at(-1)!.span, ',') },
      );
    }
    return { keyword, items, commas };
  }

  private parseOrderItem(): OrderItem {
    const expression = this.parseExpression();
    let end: Span = expression.span;
    let direction: OrderItem['direction'] = null;
    let directionSpan: Span | null = null;
    const token = this.peek();
    if (this.isAny(token, ['ASC', 'DESC'])) {
      direction = token.value as 'ASC' | 'DESC';
      directionSpan = spanOf(this.advance());
      end = directionSpan;
    }
    let nulls: OrderItem['nulls'] = null;
    let nullsSpan: Span | null = null;
    if (this.is(this.peek(), 'NULLS')) {
      const keyword = this.advance();
      const position = this.peek();
      if (!this.isAny(position, ['FIRST', 'LAST'])) {
        this.fail(
          'unexpected-token',
          'syntax',
          keyword,
          'Después de NULLS se escribe FIRST o LAST.',
          'NULLS FIRST pone primero las filas sin valor; NULLS LAST, al final.',
        );
      }
      this.advance();
      nulls = position.value as 'FIRST' | 'LAST';
      nullsSpan = between(keyword, position);
      end = nullsSpan;
    }
    const repeated = this.peek();
    if (this.isAny(repeated, ['ASC', 'DESC'])) {
      this.fail(
        'unexpected-token',
        'syntax',
        repeated,
        'Cada criterio de orden lleva una sola dirección: ASC o DESC.',
      );
    }
    return {
      expression,
      direction,
      directionSpan,
      nulls,
      nullsSpan,
      span: between(expression.span, end),
    };
  }

  /* ---------- Expresiones ---------- */

  private enter(token: Token): void {
    this.depth++;
    if (this.depth > PARSE_LIMITS.maxDepth)
      this.fail(
        'too-deep',
        'limit',
        token,
        `La consulta anida más de ${PARSE_LIMITS.maxDepth} paréntesis, el máximo de este laboratorio.`,
      );
  }

  parseExpression(): Expression {
    let left = this.parseTerm();
    for (;;) {
      const token = this.peek();
      const additive = token.kind === 'operator' && (token.value === '+' || token.value === '-');
      if (!additive && token.kind !== 'concat') return left;
      this.advance();
      const right = this.parseTerm();
      left = {
        kind: 'binary',
        operator: (token.kind === 'concat' ? '||' : token.value) as BinaryOperator,
        left,
        right,
        span: between(left.span, right.span),
      };
    }
  }

  private parseTerm(): Expression {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (token.kind !== 'operator' || (token.value !== '*' && token.value !== '/')) return left;
      this.advance();
      const right = this.parseUnary();
      left = {
        kind: 'binary',
        operator: token.value as BinaryOperator,
        left,
        right,
        span: between(left.span, right.span),
      };
    }
  }

  private parseUnary(): Expression {
    const token = this.peek();
    if (token.kind === 'operator' && (token.value === '+' || token.value === '-')) {
      this.advance();
      const operand = this.parseUnary();
      return {
        kind: 'unary',
        operator: token.value,
        operand,
        span: between(token, operand.span),
      };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    const token = this.peek();
    this.rejectSpecial(token);
    switch (token.kind) {
      case 'number':
        this.advance();
        return {
          kind: 'number',
          raw: token.text,
          value: /^\d+(\.\d+)?$/.test(token.text) ? Number(token.text) : Number.NaN,
          span: spanOf(token),
        };
      case 'string':
        this.advance();
        return { kind: 'string', raw: token.text, value: token.value, span: spanOf(token) };
      case 'identifier': {
        if (this.is(token, 'NULL')) {
          this.advance();
          return { kind: 'null', span: spanOf(token) };
        }
        const after = this.peek(1);
        if (this.is(token, 'DATE') && after.kind === 'string') {
          this.advance();
          this.advance();
          const span = between(token, after);
          if (after.unterminated) this.rejectSpecial(after);
          if (!isValidDate(after.value)) {
            this.fail(
              'invalid-date',
              'syntax',
              span,
              `${this.text(span)} no es una fecha válida: DATE espera el formato 'AAAA-MM-DD'.`,
              "Por ejemplo: DATE '2020-01-31'.",
            );
          }
          return { kind: 'date', raw: this.text(span), value: after.value, span };
        }
        if (this.isAny(token, ['TIMESTAMP', 'INTERVAL']) && after.kind === 'string') {
          this.failFuture(between(token, after), {
            label: `Los literales ${token.value}`,
            level: null,
            topic: null,
          });
        }
        if (CLAUSE_KEYWORDS.has(token.value)) this.failMissingOperand(token);
        if ((after.kind === 'lparen' || after.kind === 'dot') && SYSTEM_PACKAGE.test(token.value)) {
          this.fail(
            'statement-not-allowed',
            'security',
            between(token, after),
            `${token.text} es un paquete o recurso del sistema: su uso no está permitido y la consulta no se envía al motor.`,
          );
        }
        if (after.kind === 'lparen') {
          const known = FUNCTION_TOPICS.get(token.value);
          this.failFuture(
            between(token, after),
            known ?? { label: `${token.text}(…), una llamada a función,`, level: 2, topic: null },
            known ? undefined : 'Las funciones de Oracle se estudian a partir del Nivel 2.',
          );
        }
        if (after.kind === 'dot') {
          this.fail(
            'out-of-scope',
            'scope',
            between(token, after),
            `Los nombres compuestos como ${token.text}.… (esquema, tabla o paquete) no forman parte de esta unidad.`,
            'Escribe solo el nombre de la columna.',
          );
        }
        this.advance();
        return {
          kind: 'column',
          name: token.value,
          raw: token.text,
          quoted: false,
          span: spanOf(token),
        };
      }
      case 'quoted-identifier':
        this.advance();
        return {
          kind: 'column',
          name: token.value,
          raw: token.text,
          quoted: true,
          span: spanOf(token),
        };
      case 'lparen': {
        this.advance();
        if (this.is(this.peek(), 'SELECT')) this.failSubquery(this.peek());
        this.enter(token);
        const inner = this.parseExpression();
        this.depth--;
        const close = this.peek();
        if (close.kind !== 'rparen') {
          this.fail(
            'unbalanced-parentheses',
            'syntax',
            token,
            'Falta cerrar este paréntesis.',
            'Cada ( necesita su ) correspondiente.',
          );
        }
        this.advance();
        return { kind: 'group', expression: inner, span: between(token, close) };
      }
      case 'rparen':
        this.fail(
          'unbalanced-parentheses',
          'syntax',
          token,
          'Sobra un paréntesis de cierre o falta un valor antes de él.',
        );
      default:
        this.failMissingOperand(token);
    }
  }

  private failMissingOperand(token: Token): never {
    if (token.kind === 'identifier' && FUTURE_KEYWORDS.has(token.value)) {
      this.failFuture(token, FUTURE_KEYWORDS.get(token.value)!);
    }
    const previous = this.previous();
    if (previous?.kind === 'operator' || previous?.kind === 'concat') {
      this.fail(
        'incomplete-expression',
        'syntax',
        previous,
        `La expresión está incompleta: falta un valor después de «${previous.text}».`,
        previous.kind === 'concat'
          ? "Completa la unión con otra columna o texto, por ejemplo nombre || ' ' || apellido."
          : 'Completa la operación con una columna numérica o un número, por ejemplo salario * 12.',
      );
    }
    if (this.is(token, 'DISTINCT'))
      this.fail(
        'misplaced-keyword',
        'syntax',
        token,
        'DISTINCT va inmediatamente después de SELECT.',
      );
    if (this.isStar(token))
      this.fail(
        'star-mixed',
        'oracle',
        token,
        'En Oracle, el asterisco sin indicar la tabla no se combina con otras columnas: * ya representa todas.',
      );
    this.fail(
      'missing-item',
      'syntax',
      token,
      `Falta una columna o expresión antes de ${this.describe(token)}.`,
    );
  }

  expectEnd(): void {
    const token = this.peek();
    if (token.kind === 'eof') return;
    this.rejectSpecial(token);
    this.fail(
      'unexpected-token',
      'syntax',
      token,
      `No se esperaba ${this.describe(token)} en la expresión.`,
      'Une los valores con un operador: + - * /.',
    );
  }
}

function run<T>(action: () => T): ParseResult<T> {
  try {
    return { node: action(), diagnostics: [] };
  } catch (error) {
    if (error instanceof ParseFailure) return { node: null, diagnostics: [error.diagnostic] };
    throw error;
  }
}

export function parseSelect(
  source: string,
  tokens: readonly Token[],
  table = 'EMPLEADOS',
): ParseResult<SelectStatement> {
  return run(() => new Parser(source, tokens, table).parseStatement());
}

/** Una expresión aislada, por ejemplo la columna calculada que se construye en M05. */
export function parseExpressionOnly(
  source: string,
  tokens: readonly Token[],
): ParseResult<Expression> {
  return run(() => {
    const parser = new Parser(source, tokens);
    const expression = parser.parseExpression();
    parser.expectEnd();
    return expression;
  });
}
