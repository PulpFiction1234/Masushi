"use client";

import Head from "next/head";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "";

const ogImage = ORIGIN ? `${ORIGIN}/images/logo-masushi.webp` : "/images/logo-masushi.webp";

export default function PrivacyPolicyPage() {
  const lastUpdate = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-gray-950 text-white min-h-screen flex flex-col">
      <Seo
        title="Política de Privacidad | Masushi"
        description="Conoce cómo Masushi recopila, utiliza y protege los datos personales de sus clientes para gestionar pedidos y comunicaciones."
        canonicalPath="/privacidad"
        image={ogImage}
      />

      {ORIGIN && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "PrivacyPolicy",
                name: "Política de Privacidad – Masushi",
                url: `${ORIGIN}/privacidad`,
                inLanguage: "es-CL",
                publisher: {
                  "@type": "Organization",
                  name: "Masushi",
                  url: ORIGIN,
                },
              }),
            }}
          />
        </Head>
      )}

      <Navbar />

      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 py-10 flex-1">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Política de Privacidad – Masushi</h1>
        <p className="text-sm text-gray-400 mb-8">Última actualización: {lastUpdate}</p>

        <p className="mb-6">
          En Masushi valoramos la confianza que depositas en nosotros al compartir tus datos personales.
          Esta política describe qué información recopilamos, con qué finalidad y cuáles son tus derechos en
          relación con el tratamiento de esos datos conforme a la legislación chilena vigente, incluida la Ley N°19.628.
        </p>

        <div className="h-px bg-gray-800 my-8" />

        <section className="space-y-8">
          <article>
            <h2 className="text-2xl font-semibold mb-3">1. ¿Qué datos recopilamos?</h2>
            <p className="mb-3">Dependiendo de cómo interactúes con nosotros podemos registrar:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-200">
              <li>Datos de identificación: nombre completo, RUT (si es entregado) y fecha de nacimiento.</li>
              <li>Datos de contacto: correo electrónico, número telefónico, direcciones de entrega y referencias.</li>
              <li>Información de pedidos: productos seleccionados, preferencias de armados y comentarios que agregues.</li>
              <li>
                Datos técnicos: dirección IP, identificadores de sesión y métricas de uso anónimas recopiladas mediante cookies propias o
                de terceros para fines analíticos.
              </li>
            </ul>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">2. ¿Para qué usamos tu información?</h2>
            <p className="mb-3">Utilizamos tus datos personales para:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-200">
              <li>Procesar y despachar tus pedidos, coordinar entregas y gestionar pagos.</li>
              <li>Comunicarnos sobre el estado del pedido, notificaciones importantes, promociones relevantes o verificación de identidad.</li>
              <li>Cumplir obligaciones legales y requerimientos de autoridades competentes.</li>
              <li>Realizar análisis estadísticos internos que ayuden a mejorar nuestros productos, promociones y experiencia digital.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">3. Bases legales del tratamiento</h2>
            <p className="mb-3">Tratamos tus datos sobre la base de:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-200">
              <li>La ejecución del contrato de compraventa cuando realizas un pedido en nuestro sitio.</li>
              <li>El cumplimiento de obligaciones legales en materia tributaria, sanitaria o de protección al consumidor.</li>
              <li>Tu consentimiento expreso para acciones de marketing personalizado o para registrar tu fecha de cumpleaños.</li>
              <li>Intereses legítimos relacionados con la seguridad del sitio, prevención de fraudes y mejora continua del servicio.</li>
            </ul>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">4. ¿Con quién compartimos los datos?</h2>
            <p className="mb-3">
              Solo compartimos información cuando es estrictamente necesario para operar nuestro negocio y siempre bajo acuerdos de confidencialidad:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-200">
              <li>Proveedores tecnológicos como plataformas de hosting, sistemas de pago o mensajería que soportan el procesamiento de pedidos.</li>
              <li>Repartidores asociados o personal interno encargado del despacho.</li>
              <li>Autoridades administrativas o judiciales que requieran la información conforme a la ley.</li>
            </ul>
            <p className="mt-3">
              Nunca vendemos ni cedemos tus datos a terceros con fines comerciales ajenos a Masushi.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">5. ¿Por cuánto tiempo conservamos la información?</h2>
            <p>
              Conservamos los datos mientras exista una relación activa contigo (por ejemplo, cuentas registradas, pedidos recientes o consentimientos vigentes)
              y el tiempo adicional necesario para cumplir obligaciones legales y atender eventuales reclamos. Pasado ese periodo, los datos se eliminarán o anonimizarán.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">6. Seguridad y almacenamiento</h2>
            <p>
              Implementamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo cifrado en tránsito, controles de acceso, monitoreo de actividad
              e instancias segregadas en nuestros proveedores de nube. A pesar de ello, ningún sistema es 100% infalible y te recomendamos resguardar tus credenciales.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">7. Tus derechos</h2>
            <p className="mb-3">
              Puedes ejercer en cualquier momento los derechos de acceso, rectificación, cancelación y bloqueo (ARCO), además de la portabilidad y oposición cuando proceda.
            </p>
            <p>
              Para ejercerlos, escríbenos a <a href="mailto:masushi.spa@gmail.com" className="underline decoration-gray-600 hover:decoration-white">masushi.spa@gmail.com</a>
              indicando tu solicitud y un medio de contacto. Responderemos dentro de los plazos legales vigentes.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">8. Uso de cookies y tecnologías similares</h2>
            <p>
              Utilizamos cookies propias y de terceros para recordar tus preferencias, mantener iniciada tu sesión, analizar patrones de navegación y medir el rendimiento de campañas.
              Puedes administrar estas tecnologías desde la configuración de tu navegador o mediante herramientas opt-out de terceros como Google Analytics Opt-out.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">9. Contacto</h2>
            <p>
              Si tienes dudas sobre esta política o sobre el tratamiento de tus datos personales, contáctanos en <a href="mailto:masushi.spa@gmail.com" className="underline decoration-gray-600 hover:decoration-white">masushi.spa@gmail.com</a>
              o por WhatsApp al +56 9 4087 3865.
            </p>
          </article>

          <article>
            <h2 className="text-2xl font-semibold mb-3">10. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política cuando incorporemos nuevos procesos, herramientas o requisitos legales. Publicaremos la nueva versión en este mismo enlace y
              notificaremos a los usuarios registrados cuando el cambio sea relevante. Recomendamos revisarla periódicamente.
            </p>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
