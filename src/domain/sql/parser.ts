import type { Alias, BinaryOperator, Expression, SelectItem, SelectStatement } from './ast';
import {
  diagnostic,
  type DiagnosticCategory,
  type DiagnosticCode,
  type SqlDiagnostic,
} from './diagnostics';
import { CLAUSE_KEYWORDS, FORBIDDEN_STATEMENTS, FUTURE_KEYWORDS } from './keywords';
import type { Token } from './lexer';
import type { Span } from './source';

/**
 * Parser de descenso recursivo del subconjunto SELECT v1 (LAB_SPEC). Construye el árbol
 * sintáctico y se detiene en el primer error de sintaxis, alcance o seguridad con un
 * diagnóstico pedagógico localizado. Las comprobaciones de catálogo y alias están en
 * `analyzer.ts`.
 */

export const PARSE_LIMITS = Object.freeze({ maxItems: 12, maxDepth: 8 });

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

/** Paquetes y esquemas del sistema de Oracle: su invocación es un riesgo de seguridad. */
const SYSTEM_PACKAGE = /^(DBMS_|UTL_|SYS|CTX_|OWA_|HTP|HTF|APEX_|XDB)/;

export function futureMessage(keyword: string): string {
  return `${FUTURE_KEYWORDS.get(keyword) ?? keyword} es SQL válido en Oracle, pero pertenece a una unidad futura.`;
}

class Parser {
  private index = 0;
  private depth = 0;

  constructor(
    private readonly source: string,
    private readonly tokens: readonly Token[],
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

  private isStar(token: Token): boolean {
    return token.kind === 'operator' && token.value === '*';
  }

  private ends(token: Token): boolean {
    return token.kind === 'eof' || token.kind === 'semicolon';
  }

  private fail(
    code: DiagnosticCode,
    category: DiagnosticCategory,
    span: Span,
    message: string,
    hint?: string,
  ): never {
    throw new ParseFailure(
      diagnostic(this.source, {
        code,
        category,
        span: spanOf(span),
        message,
        ...(hint ? { hint } : {}),
      }),
    );
  }

  private describe(token: Token): string {
    return token.kind === 'eof' ? 'el final de la consulta' : `«${token.text}»`;
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
      case 'string':
        this.fail(
          'out-of-scope',
          'scope',
          token,
          `${token.text} es un literal de texto: los literales de texto pertenecen a una unidad futura.`,
          'En esta unidad se proyectan columnas y cálculos numéricos. Los alias con espacios van entre comillas dobles.',
        );
      case 'concat':
        this.fail(
          'out-of-scope',
          'scope',
          token,
          'La concatenación con || pertenece a una unidad futura.',
        );
      case 'quoted-identifier':
        if (token.unterminated)
          this.fail('unterminated-quote', 'syntax', token, 'Faltan las comillas dobles de cierre.');
        return;
      case 'symbol':
        if (/[=<>!]/.test(token.text)) {
          this.fail(
            'out-of-scope',
            'scope',
            token,
            `El símbolo ${token.text} sirve para comparar valores, algo que se hace con WHERE en una unidad futura.`,
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

  private startsElement(token: Token): boolean {
    return (
      token.kind === 'number' ||
      token.kind === 'lparen' ||
      token.kind === 'quoted-identifier' ||
      (token.kind === 'identifier' && !CLAUSE_KEYWORDS.has(token.value))
    );
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
      this.fail(
        'statement-not-allowed',
        'security',
        first,
        `${first.value} no es una consulta: modifica datos, estructura o permisos. El laboratorio solo admite SELECT y esta sentencia no se envía al motor.`,
      );
    }
    if (this.is(first, 'WITH')) this.fail('out-of-scope', 'scope', first, futureMessage('WITH'));
    if (!this.is(first, 'SELECT')) {
      const hint = 'Por ejemplo: SELECT nombre FROM empleados;';
      if (this.is(first, 'FROM')) {
        this.fail(
          'missing-select',
          'syntax',
          first,
          'Falta SELECT: una consulta primero indica qué columnas mostrar y después, con FROM, de qué tabla salen.',
          hint,
        );
      }
      this.fail(
        'missing-select',
        'syntax',
        first,
        `La consulta debe comenzar con SELECT, no con ${this.describe(first)}.`,
        hint,
      );
    }
    const selectKeyword = spanOf(this.advance());

    let distinct: Span | null = null;
    const modifier = this.peek();
    if (this.is(modifier, 'DISTINCT')) distinct = spanOf(this.advance());
    else if (this.is(modifier, 'UNIQUE') || this.is(modifier, 'ALL')) {
      this.fail(
        'out-of-scope',
        'scope',
        modifier,
        `${modifier.value} después de SELECT es válido en Oracle, pero en esta unidad se usa DISTINCT.`,
      );
    }

    const { items, commas } = this.parseSelectList();
    const fromToken = this.peek();
    if (!this.is(fromToken, 'FROM')) this.failMissingFrom(fromToken);
    const fromKeyword = spanOf(this.advance());
    const table = this.parseTable();
    this.parseAfterTable();

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
    return {
      kind: 'select',
      selectKeyword,
      distinct,
      items,
      commas,
      fromKeyword,
      table,
      terminator,
      span: { start: selectKeyword.start, end: (terminator ?? table.span).end },
    };
  }

  private failMissingFrom(token: Token): never {
    this.rejectSpecial(token);
    if (this.ends(token)) {
      this.fail(
        'missing-from',
        'syntax',
        token.kind === 'eof' ? (this.previous() ?? token) : token,
        'Falta FROM: después de las columnas indica de qué tabla salen los datos.',
        'Por ejemplo: … FROM empleados;',
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
        futureMessage(token.value),
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
        );
      }
      if (after.kind === 'comma')
        this.fail(
          'missing-item',
          'syntax',
          after,
          'Hay dos comas seguidas: falta una columna entre ellas.',
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
          'scope',
          token,
          'El asterisco ya representa todas las columnas: en esta unidad no se combina con otras.',
          'Usa * solo, o escribe la lista de columnas.',
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
    const alias = this.parseAlias();
    const next = this.peek();
    this.rejectSpecial(next);
    if (this.startsElement(next)) {
      const previous = this.previous()!;
      this.fail(
        'missing-comma',
        'syntax',
        next,
        `Falta una coma entre ${previous.text} y ${next.text}.`,
        alias && !alias.explicit
          ? `Sin coma, ${alias.raw} ya se leyó como alias de la columna anterior y ${next.text} no puede seguirle.`
          : 'Separa cada columna o expresión con una coma.',
      );
    }
    if (next.kind === 'rparen')
      this.fail('unbalanced-parentheses', 'syntax', next, 'Sobra un paréntesis de cierre.');
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
    if (this.ends(token))
      this.fail(
        'missing-table',
        'syntax',
        this.previous() ?? token,
        'Después de FROM escribe el nombre de la tabla: empleados.',
      );
    if (token.kind === 'lparen')
      this.fail(
        'out-of-scope',
        'scope',
        token,
        'Usar una subconsulta como origen pertenece a una unidad futura.',
      );
    if (token.kind === 'quoted-identifier') {
      this.fail(
        'unknown-table',
        'table',
        token,
        'En este laboratorio la tabla se escribe sin comillas.',
        'Escribe FROM empleados.',
      );
    }
    if (this.is(token, 'DUAL'))
      this.fail(
        'out-of-scope',
        'scope',
        token,
        futureMessage('DUAL'),
        'La tabla de este laboratorio es EMPLEADOS.',
      );
    if (token.kind !== 'identifier' || CLAUSE_KEYWORDS.has(token.value)) {
      this.fail(
        'missing-table',
        'syntax',
        token,
        `Falta el nombre de la tabla después de FROM; se encontró ${this.describe(token)}.`,
        'Escribe FROM empleados.',
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

  private parseAfterTable(): void {
    const token = this.peek();
    if (this.ends(token)) return;
    this.rejectSpecial(token);
    if (token.kind === 'comma')
      this.fail(
        'out-of-scope',
        'scope',
        token,
        `Consultar varias tablas a la vez: ${futureMessage('JOIN')}`,
      );
    if (token.kind === 'identifier' && FUTURE_KEYWORDS.has(token.value)) {
      this.fail(
        'out-of-scope',
        'scope',
        token,
        futureMessage(token.value),
        'En esta unidad la consulta termina después de FROM empleados.',
      );
    }
    if (this.is(token, 'AS')) {
      const name = this.peek(1);
      this.fail(
        'table-alias',
        'scope',
        { start: token.start, end: name.end },
        `AS ${name.text} después de la tabla sería un alias de tabla, no de columna; los alias de tabla no forman parte de esta unidad.`,
        'Para nombrar una columna, escribe AS justo después de la columna o expresión.',
      );
    }
    if (token.kind === 'identifier' && !CLAUSE_KEYWORDS.has(token.value)) {
      this.fail(
        'table-alias',
        'scope',
        token,
        `${token.text} después de la tabla sería un alias de tabla; los alias de tabla no forman parte de esta unidad.`,
        'Escribe solo FROM empleados.',
      );
    }
    this.fail(
      'unexpected-token',
      'syntax',
      token,
      `No se esperaba ${this.describe(token)} después de la tabla.`,
      'La consulta termina después de FROM empleados, con un punto y coma opcional.',
    );
  }

  /* ---------- Expresiones ---------- */

  parseExpression(): Expression {
    let left = this.parseTerm();
    for (;;) {
      const token = this.peek();
      if (token.kind === 'concat') this.rejectSpecial(token);
      if (token.kind !== 'operator' || (token.value !== '+' && token.value !== '-')) return left;
      this.advance();
      const right = this.parseTerm();
      left = {
        kind: 'binary',
        operator: token.value as BinaryOperator,
        left,
        right,
        span: { start: left.span.start, end: right.span.end },
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
        span: { start: left.span.start, end: right.span.end },
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
        span: { start: token.start, end: operand.span.end },
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
      case 'identifier': {
        if (CLAUSE_KEYWORDS.has(token.value)) this.failMissingOperand(token);
        const after = this.peek(1);
        if ((after.kind === 'lparen' || after.kind === 'dot') && SYSTEM_PACKAGE.test(token.value)) {
          this.fail(
            'statement-not-allowed',
            'security',
            { start: token.start, end: after.end },
            `${token.text} es un paquete o recurso del sistema: su uso no está permitido y la consulta no se envía al motor.`,
          );
        }
        if (after.kind === 'lparen') {
          this.fail(
            'out-of-scope',
            'scope',
            { start: token.start, end: after.end },
            `${token.text}(…) es una llamada a función: las funciones pertenecen a una unidad futura.`,
            'En esta unidad se usan columnas, números y los operadores + - * /.',
          );
        }
        if (after.kind === 'dot') {
          this.fail(
            'out-of-scope',
            'scope',
            { start: token.start, end: after.end },
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
        if (this.is(this.peek(), 'SELECT'))
          this.fail(
            'out-of-scope',
            'scope',
            this.peek(),
            'Una consulta dentro de otra (subconsulta) pertenece a una unidad futura.',
          );
        this.depth++;
        if (this.depth > PARSE_LIMITS.maxDepth)
          this.fail(
            'too-deep',
            'limit',
            token,
            `La expresión anida más de ${PARSE_LIMITS.maxDepth} paréntesis, el máximo de este laboratorio.`,
          );
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
        return { kind: 'group', expression: inner, span: { start: token.start, end: close.end } };
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
    const previous = this.previous();
    if (previous?.kind === 'operator') {
      this.fail(
        'incomplete-expression',
        'syntax',
        previous,
        `La expresión está incompleta: falta un valor después de «${previous.text}».`,
        'Completa la operación con una columna numérica o un número, por ejemplo salario * 12.',
      );
    }
    if (this.is(token, 'DISTINCT'))
      this.fail(
        'misplaced-keyword',
        'syntax',
        token,
        'DISTINCT va inmediatamente después de SELECT.',
      );
    if (token.kind === 'identifier' && FUTURE_KEYWORDS.has(token.value))
      this.fail('out-of-scope', 'scope', token, futureMessage(token.value));
    if (this.isStar(token))
      this.fail(
        'star-mixed',
        'scope',
        token,
        'El asterisco ya representa todas las columnas: en esta unidad no se combina con otras.',
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
): ParseResult<SelectStatement> {
  return run(() => new Parser(source, tokens).parseStatement());
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
