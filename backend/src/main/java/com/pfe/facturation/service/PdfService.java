package com.pfe.facturation.service;

import com.pfe.facturation.dto.FactureResponseDTO;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class PdfService {

    private final TemplateEngine templateEngine;

    public PdfService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public byte[] generateFacturePdf(FactureResponseDTO facture) throws Exception {
        // 1. Préparer les données pour le template HTML
        Context context = new Context();
        Map<String, Object> data = new HashMap<>();
        data.put("facture", facture);
        
        // Formater la date d'émission manuellement car c'est une String (ISO)
        String dateEmissionFormatee = "";
        if (facture.dateEmission() != null && facture.dateEmission().length() >= 10) {
            String de = facture.dateEmission();
            dateEmissionFormatee = de.substring(8, 10) + "/" + de.substring(5, 7) + "/" + de.substring(0, 4);
        }
        data.put("dateEmissionFormatee", dateEmissionFormatee);
        
        context.setVariables(data);

        // 2. Générer le code HTML via le modèle facture-template.html
        String htmlContent = templateEngine.process("facture-template", context);

        // 3. Convertir le HTML en PDF de façon native avec OpenPDF / Flying Saucer
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ITextRenderer renderer = new ITextRenderer();
        
        // Flying Saucer requiert un XML/XHTML valide
        renderer.setDocumentFromString(htmlContent);
        renderer.layout();
        renderer.createPDF(outputStream);

        return outputStream.toByteArray();
    }
}
