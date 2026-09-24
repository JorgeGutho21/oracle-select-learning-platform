import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { HomeDemonstration } from './home-demonstration';

export function HomePage({ progress }: { readonly progress: ReactNode }) {
  return (
    <div className="site-container learning-home">
      <section className="learning-hero" data-theme="dark" aria-labelledby="home-title">
        <div className="learning-hero-copy">
          <span className="eyebrow">ORACLE DATABASE · SQL FUNDAMENTALS</span>
          <h1 id="home-title">SELECT<br /><span>EN ORACLE SQL</span><span className="home-title-dot" aria-hidden="true">.</span></h1>
          <p className="home-lead">De una pregunta a una consulta.<br />Aprende a leer los datos, elegir lo que necesitas y entender cada resultado.</p>
          <div className="hero-actions">
            <Link href="/presentation" className="hero-action hero-action--primary">Iniciar clase <span aria-hidden="true">↗</span></Link>
            <Link href="/learn" className="hero-action">Modo Estudio <span aria-hidden="true">→</span></Link>
          </div>
          <div className="home-secondary-actions">
            <Link href="/lab">Laboratorio SQL <span aria-hidden="true">↗</span></Link>
            <Link href="/challenge">SQL Challenge <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="home-hero-label">OBSERVA <span aria-hidden="true">/</span> COMPRENDE <span aria-hidden="true">/</span> PRACTICA</p>
        </div>
        <HomeDemonstration />
      </section>
      <section className="home-identity" aria-label="Identidad académica">
        <Image src={identity.logo} width={805} height={417} alt={identity.institution} className="institution-logo" priority />
        <div><strong>{identity.institution}</strong><p>{identity.program} · {identity.course}</p></div>
        <dl><div><dt>Presentado por</dt><dd>{identity.author}</dd></div><div><dt>Docente</dt><dd>{identity.teacher}</dd></div></dl>
      </section>
      <section className="home-study-band" aria-label="Tu recorrido de estudio">{progress}</section>
      <section className="home-learning-section" aria-labelledby="learning-title">
        <div className="home-section-heading"><span className="eyebrow">01 / COMIENZA POR LO ESENCIAL</span><h2 id="learning-title">Una tabla. Muchas respuestas.</h2><p className="muted">No necesitas experiencia previa. Empieza con seis empleados y descubre cómo una consulta transforma lo que ves.</p></div>
        <div className="home-concept-grid">
          <Link href="/learn/select" className="home-concept-card"><span className="home-card-number">01</span><code>SELECT / FROM</code><h3>Qué necesitas.<br />De dónde viene.</h3><p>Lee la tabla y elige la información que responde a tu pregunta.</p><span className="home-card-link">Elegir columnas <span aria-hidden="true">↗</span></span></Link>
          <Link href="/learn/expresiones" className="home-concept-card"><span className="home-card-number">02</span><code>* 12 AS salario_anual</code><h3>Calcula.<br />Dale un nombre.</h3><p>Obtén nuevos valores y ponles una etiqueta sin cambiar la tabla original.</p><span className="home-card-link">Explorar expresiones <span aria-hidden="true">↗</span></span></Link>
          <Link href="/learn/distinct" className="home-concept-card"><span className="home-card-number">03</span><code>SELECT DISTINCT</code><h3>Encuentra<br />lo que es único.</h3><p>Observa las repeticiones y comprende qué significa un resultado distinto.</p><span className="home-card-link">Entender DISTINCT <span aria-hidden="true">↗</span></span></Link>
        </div>
      </section>
      <section className="home-path-section" aria-labelledby="path-title">
        <div className="home-section-heading"><span className="eyebrow">02 / A TU MANERA</span><h2 id="path-title">Del concepto a la práctica.</h2></div>
        <div className="home-path-grid">
          <Link href="/learn" className="home-path-card"><span className="home-path-icon" aria-hidden="true">Aa</span><div><h3>Modo Estudio</h3><p>Nueve lecciones visuales. Ejemplos, transformaciones y una comprobación a tu ritmo.</p></div><span aria-hidden="true">↗</span></Link>
          <Link href="/presentation" className="home-path-card"><span className="home-path-icon" aria-hidden="true">▱</span><div><h3>Modo Exposición</h3><p>Una idea por escena. Un recorrido para conversar, observar y aprender en clase.</p></div><span aria-hidden="true">↗</span></Link>
          <Link href="/lab" className="home-path-card"><span className="home-path-icon" aria-hidden="true">&gt;_</span><div><h3>Laboratorio SQL</h3><p>Escribe y analiza tu consulta. La ejecución real en Oracle está pendiente de conexión.</p></div><span aria-hidden="true">↗</span></Link>
          <Link href="/challenge" className="home-path-card"><span className="home-path-icon" aria-hidden="true">{'{}'}</span><div><h3>SQL Oracle Challenge</h3><p>Nueve misiones para practicar. El reto final espera la conexión con Oracle.</p></div><span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <section className="home-video-section" aria-labelledby="intro-title">
        <div className="home-video-slot"><span aria-hidden="true">▷</span><strong>Una primera mirada a SQL</strong><span>Vídeo introductorio · En preparación</span></div>
        <div><span className="eyebrow">ANTES DE EMPEZAR</span><h2 id="intro-title">Los datos ya están.<br />La pregunta es tuya.</h2><p>Imagina que necesitas saber en qué ciudades trabaja un equipo. SQL te permite pedir esa información con una consulta.</p><p className="muted">El vídeo se incorporará con subtítulos y transcripción. Mientras tanto, la introducción está disponible como lección.</p><Link href="/learn/introduccion" className="inline-action">Comenzar desde cero <span aria-hidden="true">→</span></Link></div>
      </section>
      <section className="home-future-section" id="proximos-modulos" aria-labelledby="future-title">
        <div className="home-section-heading"><span className="eyebrow">EL SIGUIENTE PASO</span><h2 id="future-title">Una base para seguir aprendiendo.</h2><p className="muted">Estos temas llegarán en futuras unidades. El recorrido actual se concentra en SELECT.</p></div>
        <div className="home-future-grid">{[
          ['WHERE', 'Elegir filas mediante condiciones.'], ['BETWEEN · IN · LIKE', 'Explorar rangos, listas y patrones.'], ['JOIN', 'Relacionar información entre tablas.'], ['GROUP BY · Funciones', 'Agrupar datos y resumir información.'],
        ].map(([title, description]) => <article key={title}><span className="home-future-tag">Próximamente</span><h3>{title}</h3><p>{description}</p><small>Prerrequisito: fundamentos de SELECT.</small></article>)}</div>
      </section>
    </div>
  );
}
