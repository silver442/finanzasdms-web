import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800/50 px-6 py-4">
        <Link to="/" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">
          ← Volver al inicio
        </Link>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Aviso de Privacidad</h1>
            <p className="text-slate-400 text-sm">Última actualización: mayo de 2025</p>
          </div>

          <p className="text-slate-300 leading-relaxed">
            En <span className="text-emerald-400 font-semibold">FinanzasDMS</span> nos comprometemos a proteger y respetar tu privacidad. El presente Aviso de Privacidad describe cómo recopilamos, usamos y salvaguardamos la información personal que nos proporcionas al utilizar nuestra plataforma, de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás normativa aplicable.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-emerald-400">1. Información que recopilamos</h2>
            <p className="text-slate-300 leading-relaxed">
              Para brindarte acceso a los servicios de FinanzasDMS, podemos recopilar los siguientes datos personales:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
              <li><span className="text-slate-300 font-medium">Datos de cuenta:</span> nombre completo, dirección de correo electrónico, número de teléfono y contraseña (almacenada de forma cifrada).</li>
              <li><span className="text-slate-300 font-medium">Información de transacciones y préstamos:</span> montos solicitados, historial de pagos, cuotas, fechas de vencimiento y nivel de gamificación.</li>
              <li><span className="text-slate-300 font-medium">Datos de uso de la plataforma:</span> módulos activados, interacciones con el dashboard y métricas de comportamiento dentro de la aplicación.</li>
              <li><span className="text-slate-300 font-medium">Datos técnicos:</span> dirección IP, tipo de navegador y sistema operativo, únicamente con fines de seguridad y diagnóstico.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-emerald-400">2. Uso de la información</h2>
            <p className="text-slate-300 leading-relaxed">
              Los datos personales recabados se utilizan exclusivamente para las finalidades siguientes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
              <li>Proveer y mantener el servicio del dashboard y los módulos financieros activos en tu cuenta.</li>
              <li>Procesar solicitudes de préstamos y gestionar el historial de cuotas e installments.</li>
              <li>Enviar notificaciones relacionadas con pagos, vencimientos y cambios en tu nivel de gamificación.</li>
              <li>Mejorar continuamente la plataforma mediante análisis agregados y anónimos de uso.</li>
              <li>Cumplir con obligaciones legales y requerimientos de autoridades competentes cuando sea aplicable.</li>
            </ul>
            <p className="text-slate-400 leading-relaxed text-sm">
              No compartimos, vendemos ni cedemos tu información personal a terceros con fines comerciales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-emerald-400">3. Seguridad de los datos</h2>
            <p className="text-slate-300 leading-relaxed">
              Implementamos medidas técnicas y organizacionales razonables para proteger tu información personal contra accesos no autorizados, pérdida o divulgación indebida:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
              <li>Transmisión de datos cifrada mediante protocolos HTTPS/TLS.</li>
              <li>Almacenamiento en servidores con acceso restringido y configuraciones de seguridad actualizadas.</li>
              <li>Control de acceso basado en roles (RBAC) para limitar el acceso interno a los datos.</li>
              <li>Contraseñas almacenadas mediante hashing con sal siguiendo buenas prácticas de la industria fintech.</li>
            </ul>
            <p className="text-slate-400 leading-relaxed text-sm">
              A pesar de nuestros esfuerzos, ningún sistema de transmisión o almacenamiento de datos puede garantizar seguridad absoluta. Te recomendamos mantener tu contraseña confidencial y notificarnos ante cualquier actividad sospechosa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-emerald-400">4. Derechos del usuario (ARCO)</h2>
            <p className="text-slate-300 leading-relaxed">
              De conformidad con la LFPDPPP, tienes derecho a:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
              <li><span className="text-slate-300 font-medium">Acceso:</span> conocer qué datos personales tenemos sobre ti y cómo los utilizamos.</li>
              <li><span className="text-slate-300 font-medium">Rectificación:</span> solicitar la corrección de datos inexactos o incompletos.</li>
              <li><span className="text-slate-300 font-medium">Cancelación:</span> pedir la supresión de tus datos cuando no sean necesarios para la prestación del servicio.</li>
              <li><span className="text-slate-300 font-medium">Oposición:</span> oponerte al uso de tus datos para finalidades específicas.</li>
            </ul>
            <p className="text-slate-300 leading-relaxed">
              Para ejercer cualquiera de estos derechos, contáctanos a través de la página de <Link to="/contact" className="text-emerald-400 hover:underline">Contacto</Link>. Atenderemos tu solicitud en los plazos establecidos por la legislación aplicable.
            </p>
          </section>

          <p className="text-slate-500 text-sm border-t border-slate-800/50 pt-6">
            FinanzasDMS se reserva el derecho de actualizar este Aviso de Privacidad en cualquier momento. Los cambios serán notificados a través de la plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}
