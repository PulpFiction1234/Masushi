"use client";

import React from "react";
import Link from "next/link";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

interface FooterProps {
  showSocial?: boolean;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ showSocial = true, className = "" }) => {
  return (
    <footer className={`bg-gray-900 text-white py-6 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Social icons */}
          {showSocial ? (
            <div className="justify-self-start flex items-center gap-5">
              <a
                href="https://www.instagram.com/masushiciudaddeleste"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Masushi"
                className="transition hover:scale-110 "
                title="Instagram"
              >
                <Instagram className="h-6 w-6 text-pink-500 hover:text-gray-100" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/mazushiltda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Masushi"
                className="transition hover:scale-110 "
                title="Facebook"
              >
                <Facebook className="h-6 w-6 text-blue-500 hover:text-gray-100" aria-hidden="true" />
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=56940873865&text=Hola%20quiero%20más%20información" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp de Masushi"
                className="transition hover:scale-110 "
                title="WhatsApp"
              >
                <MessageCircle className="h-6 w-6 text-green-500 hover:text-gray-100" aria-hidden="true" />
              </a>
            </div>
          ) : (
            <div className="justify-self-start" />
          )}

          {/* Center: text */}
          <p className="text-center">
            Masushi © {new Date().getFullYear()} - Todos los derechos reservados
          </p>

          <div className="text-right flex flex-col items-end gap-1">
            <Link href="/terminos" className="hover:underline">
              Términos y condiciones
            </Link>
            <Link href="/privacidad" className="hover:underline">
              Política de privacidad
            </Link>
          </div>

          {/* Right: spacer */}
          <div className="justify-self-end" aria-hidden />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

