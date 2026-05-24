// src/pages/terminos.tsx
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

export default function TerminosPage() {
  const lastUpdate = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      {/* Metadatos SEO */}
      <Seo
        title="Términos y Condiciones | Masushi"
        description="Condiciones de uso del sitio, pedidos, pagos, delivery, cambios/devoluciones y protección de datos de Masushi."
        canonicalPath="/terminos"
        image={ogImage}
      />

      {/* JSON-LD: migas + WebPage */}
      {ORIGIN && (
        <Head>
          {/* Breadcrumbs (Inicio > Términos y Condiciones) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Inicio",
                    item: ORIGIN,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Términos y Condiciones",
                    item: `${ORIGIN}/terminos`,
                  },
                ],
              }),
            }}
          />
          {/* WebPage (página legal) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: "Términos y Condiciones – Masushi",
                url: `${ORIGIN}/terminos`,
                inLanguage: "es-CL",
                isPartOf: {
                  "@type": "WebSite",
                  url: ORIGIN,
                  name: "Masushi",
                },
              }),
            }}
          />
        </Head>
      )}

      <Navbar />

      <main className="max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 py-10 flex-1">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Términos y Condiciones – Masushi
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Última actualización: {lastUpdate}
        </p>

        <p className="mb-6">
          Bienvenido a Masushi. Al acceder y utilizar nuestro sitio web{" "}
          <a
            href="https://www.masushi.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-gray-600 hover:decoration-white"
          >
            www.masushi.cl
          </a>
          , aceptas cumplir con los siguientes términos y condiciones. Si no
          estás de acuerdo con ellos, te recomendamos no usar nuestro servicio.
        </p>

        <div className="h-px bg-[#1a1a1a] my-8" />

        <ol className="list-decimal pl-6 space-y-8">
          <li>
            <h2 className="text-2xl font-semibold mb-3">
              Identificación de la empresa
            </h2>
            <p className="mb-3">
              Masushi es un negocio de comida japonesa que ofrece venta de
              sushi a través de pedidos en línea y retiro/delivery.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-200">
              <li>
                <span className="text-gray-400">Razón social:</span> Sociedad masushi spa
              </li>
              <li>
                <span className="text-gray-400">RUT:</span> 78.229.101-7
              </li>
              <li>
                <span className="text-gray-400">Dirección:</span> Av. Parque Central 06477, Local 105, Puente Alto
              </li>
              <li>
                <span className="text-gray-400">Teléfono/WhatsApp:</span> 227557931 / +56 9 4087 3865
              </li>
              <li>
                <span className="text-gray-400">Correo electrónico:</span>{" "}
                masushi.spa@gmail.com
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Uso del sitio web</h2>
            <p className="mb-3">El usuario se compromete a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Entregar información veraz y actualizada al realizar pedidos.</li>
              <li>
                No realizar usos indebidos del sitio (fraudes, suplantación de
                identidad, intentos de hackeo, etc.).
              </li>
              <li>
                Ser mayor de 18 años o contar con autorización de un adulto
                responsable para comprar.
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Productos y precios</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Los precios publicados en <span className="font-medium">www.masushi.cl</span> están
                expresados en pesos chilenos (CLP) e incluyen impuestos cuando
                corresponda.
              </li>
              <li>
                Los precios y promociones pueden variar sin previo aviso, pero
                los pedidos confirmados mantendrán las condiciones pactadas.
              </li>
              <li>
                Las imágenes de los productos son referenciales, pudiendo
                existir diferencias menores en presentación.
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Pedidos y pagos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                El pedido se considerará confirmado solo una vez recibido el
                pago a través de los medios habilitados en el sitio.
              </li>
              <li>
                Aceptamos los siguientes métodos de pago: [transferencia
                bancaria, tarjetas de crédito/débito, efectivo al momento del
                retiro o entrega, etc.].
              </li>
              <li>
                En caso de que un producto no esté disponible, se notificará al
                cliente para ofrecer un reemplazo o la devolución del dinero.
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">
              Delivery y tiempos de entrega
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                El servicio de reparto está disponible en sectores y comunas
                específicas, indicadas en el sitio web.
              </li>
              <li>
                Los tiempos de entrega son estimados y pueden variar según
                factores externos (clima, tráfico, alta demanda).
              </li>
              <li>
                El cliente es responsable de proporcionar una dirección correcta
                y accesible. Si la entrega no puede realizarse por error en la
                dirección o ausencia del cliente, se podrá reprogramar con un
                costo adicional.
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">
              Cambios, devoluciones y reclamos
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Por tratarse de productos alimenticios frescos, no se aceptan
                devoluciones una vez entregado el pedido.
              </li>
              <li>
                En caso de recibir un producto en mal estado o distinto al
                solicitado, el cliente debe contactarnos dentro de las 2 horas
                posteriores a la entrega, enviando evidencia (fotos). Se
                evaluará la reposición o devolución correspondiente.
              </li>
              <li>
                Los reclamos pueden realizarse a través de nuestro correo o
                directamente en el local.
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Propiedad intelectual</h2>
            <p>
              Todo el contenido del sitio <span className="font-medium">www.masushi.cl</span> (logos,
              imágenes, textos, diseño, software) es propiedad de Masushi y no
              puede ser reproducido sin autorización previa.
            </p>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Protección de datos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                La información personal entregada por los clientes será
                utilizada únicamente para la gestión de pedidos y fines
                relacionados con el servicio.
              </li>
              <li>
                Nos comprometemos a proteger la privacidad de los usuarios de
                acuerdo con la legislación vigente en Chile (Ley N° 19.628
                sobre protección de la vida privada).
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Responsabilidad</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Masushi no se hace responsable por daños o perjuicios derivados
                del uso incorrecto de los productos.
              </li>
              <li>
                El consumo de alimentos es bajo responsabilidad del cliente,
                especialmente en casos de alergias alimentarias. Se recomienda
                revisar detalladamente la descripción de los productos.
              </li>
            </ul>
          </li>

          <li>
            <h2 className="text-2xl font-semibold mb-3">Modificaciones</h2>
            <p>
              Masushi se reserva el derecho de modificar estos Términos y
              Condiciones en cualquier momento. Los cambios se publicarán en
              esta misma página y entrarán en vigencia desde su fecha de
              publicación.
            </p>
          </li>
        </ol>

        <div className="h-px bg-[#1a1a1a] my-10" />

        <section aria-labelledby="contacto">
          <h2 id="contacto" className="text-2xl font-semibold mb-3">
            📌 Contacto
          </h2>
          <ul className="list-none pl-0 space-y-1">
            <li>
              <a
                href="mailto:masushi.spa@gmail.com"
                className="underline decoration-gray-600 hover:decoration-white"
              >
                masushi.spa@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/56940873865"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-gray-600 hover:decoration-white"
              >
                +56 9 4087 3865
              </a>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
