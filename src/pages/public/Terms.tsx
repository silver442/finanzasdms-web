import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-surface-950 text-white flex flex-col">
      <header className="border-b border-surface-800/50 px-6 py-4">
        <Link to="/" className="text-text-secondary hover:text-white text-sm font-semibold transition-colors">
          ← Volver al inicio
        </Link>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Términos y Condiciones</h1>
            <p className="text-text-secondary text-sm">Última actualización: mayo de 2025</p>
          </div>

          <p className="text-text-primary leading-relaxed">
            Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma <span className="text-brand-green-light font-semibold">FinanzasDMS</span>. Al registrarte o utilizar cualquiera de nuestros servicios, aceptas en su totalidad las condiciones descritas a continuación.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-green-light">1. Aceptación de los términos</h2>
            <p className="text-text-primary leading-relaxed">
              El uso de FinanzasDMS implica la aceptación plena e incondicional de estos Términos y Condiciones, así como de nuestro <Link to="/privacy" className="text-brand-green-light hover:underline">Aviso de Privacidad</Link>. Si no estás de acuerdo con alguna de las disposiciones aquí establecidas, debes abstenerte de utilizar la plataforma.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Las actualizaciones serán publicadas en esta página e informadas dentro de la plataforma. El uso continuado del servicio después de cualquier cambio constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-green-light">2. Uso de la plataforma</h2>
            <p className="text-text-primary leading-relaxed">
              FinanzasDMS es una <span className="font-semibold">herramienta de gestión y análisis financiero personal</span>. No constituye, ni debe interpretarse como, un asesor financiero legal, una institución bancaria, una entidad regulada por la Comisión Nacional Bancaria y de Valores (CNBV) ni ningún otro organismo financiero.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Las decisiones financieras tomadas con base en la información presentada en la plataforma son responsabilidad exclusiva del usuario. FinanzasDMS no garantiza rendimientos, rentabilidades ni resultados específicos derivados del uso de sus módulos (Préstamos, Screener Cripto, Portafolio Bursátil, Academia, entre otros).
            </p>
            <p className="text-text-secondary leading-relaxed">
              Queda prohibido utilizar la plataforma para fines ilegales, fraudulentos o que atenten contra los derechos de terceros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-green-light">3. Cuentas de usuario</h2>
            <p className="text-text-primary leading-relaxed">
              Para acceder a los servicios de FinanzasDMS debes crear una cuenta proporcionando información veraz y actualizada. Eres responsable de:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary pl-2">
              <li>Mantener la confidencialidad de tu contraseña y credenciales de acceso.</li>
              <li>Notificarnos de inmediato ante cualquier acceso no autorizado o sospecha de vulneración de tu cuenta.</li>
              <li>Todas las acciones realizadas desde tu cuenta, incluyendo solicitudes de préstamos y transacciones registradas.</li>
            </ul>
            <p className="text-text-secondary leading-relaxed">
              La cuenta es personal e intransferible. No está permitido compartir credenciales ni ceder el acceso a terceros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-green-light">4. Propiedad intelectual</h2>
            <p className="text-text-primary leading-relaxed">
              Todo el contenido de FinanzasDMS, incluyendo pero no limitado a: diseño visual, código fuente, logotipos, textos, gráficas e interfaz de usuario, es propiedad exclusiva de sus titulares y está protegido por las leyes de propiedad intelectual aplicables.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Queda expresamente prohibida la reproducción, distribución, modificación o uso comercial de cualquier elemento de la plataforma sin autorización escrita previa de FinanzasDMS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-brand-green-light">5. Limitación de responsabilidad</h2>
            <p className="text-text-primary leading-relaxed">
              FinanzasDMS se proporciona "tal cual", sin garantías de ningún tipo, ya sean expresas o implícitas. En particular:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary pl-2">
              <li>No garantizamos la disponibilidad ininterrumpida ni libre de errores de la plataforma.</li>
              <li>No nos responsabilizamos por la exactitud absoluta de los datos financieros presentados (cotizaciones, alertas técnicas, rendimientos de portafolio).</li>
              <li>No seremos responsables por pérdidas económicas, daños directos o indirectos derivados de decisiones financieras tomadas con base en la información de la plataforma.</li>
              <li>No garantizamos que la plataforma esté libre de vulnerabilidades, virus u otros componentes dañinos, aunque aplicamos medidas razonables de seguridad.</li>
            </ul>
            <p className="text-text-secondary leading-relaxed">
              La responsabilidad máxima de FinanzasDMS ante cualquier reclamación se limitará, en todos los casos, al importe efectivamente pagado por el usuario durante los últimos tres meses de servicio, o a lo que establezca la legislación aplicable.
            </p>
          </section>

          <p className="text-text-muted text-sm border-t border-surface-800/50 pt-6">
            Para cualquier consulta relacionada con estos términos, visita nuestra página de <Link to="/contact" className="text-brand-green-light hover:underline">Contacto</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
