"use client";

import React from "react";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";

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
                href="https://www.instagram.com/mazushiciudaddeleste"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Masushi"
                className="transition hover:scale-110 "
                title="Instagram"
              >
                <FaInstagram className="text-2xl text-pink-500 hover:text-gray-100" />
              </a>
              <a
                href="https://www.facebook.com/mazushiltda"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook de Masushi"
                className="transition hover:scale-110 "
                title="Facebook"
              >
                <FaFacebook className="text-2xl text-blue-500 hover:text-gray-100" />
              </a>
              <a
                href="https://wa.me/56912345678"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp de Masushi"
                className="transition hover:scale-110 "
                title="WhatsApp"
              >
                <FaWhatsapp className="text-2xl text-green-500 hover:text-gray-100" />
              </a>
            </div>
          ) : (
            <div className="justify-self-start" />
          )}

          {/* Center: text */}
          <p className="text-center">
            Masushi © {new Date().getFullYear()} - Todos los derechos reservados
          </p>

          {/* Right: spacer */}
          <div className="justify-self-end" aria-hidden />
        </div>
      </div>
    </footer>
  );
};

export default Footer;