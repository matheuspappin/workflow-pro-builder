"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Modal, ModalContent, ModalTrigger } from "@/components/ui/modal";
import { Play } from "lucide-react";

export function SaibaMaisModal({ lang = 'pt' }: { lang?: 'pt' | 'en' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full hover:bg-muted/50 transition-all hover:scale-105 group">
          <Play className="mr-2 w-5 h-5 fill-current opacity-50 group-hover:opacity-100 transition-opacity" />
          {lang === 'pt' ? 'Saiba Mais' : 'Learn More'}
        </Button>
      </ModalTrigger>
      <ModalContent className="max-w-3xl">
        <div className="aspect-video">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </ModalContent>
    </Modal>
  );
}
