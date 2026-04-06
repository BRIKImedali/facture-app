package com.pfe.facturation.service;

import com.pfe.facturation.dto.FactureResponseDTO;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service d'envoi d'emails via SendGrid (SMTP relay).
 * Génère le PDF de la facture et l'envoie en pièce jointe
 * à l'adresse email du client.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final PdfService pdfService;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    public EmailService(JavaMailSender mailSender, PdfService pdfService) {
        this.mailSender = mailSender;
        this.pdfService = pdfService;
    }

    /**
     * Envoie la facture en PDF par email au client.
     *
     * @param facture le DTO de la facture à envoyer
     * @throws IllegalArgumentException si le client n'a pas d'adresse email
     * @throws Exception en cas d'erreur de génération PDF ou d'envoi
     */
    public void sendFactureEmail(FactureResponseDTO facture) throws Exception {
        // Vérifier que le client a une adresse email
        if (facture.client() == null || facture.client().email() == null || facture.client().email().isBlank()) {
            throw new IllegalArgumentException(
                "Le client \"" + (facture.client() != null ? facture.client().nom() : "inconnu")
                + "\" n'a pas d'adresse email renseignée."
            );
        }

        String clientEmail = facture.client().email();
        String clientNom   = facture.client().nom();
        String factureNum  = facture.numero();

        // 1. Générer le PDF
        byte[] pdfBytes = pdfService.generateFacturePdf(facture);

        // 2. Construire le message MIME (avec pièce jointe)
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(clientEmail);
        helper.setSubject("Votre facture n° " + factureNum);

        // Corps de l'email (HTML simple)
        String htmlBody = buildEmailBody(clientNom, factureNum,
                facture.totalTTC() != null ? facture.totalTTC().toPlainString() : "—");
        helper.setText(htmlBody, true);

        // Pièce jointe PDF
        String filename = "Facture_" + factureNum + ".pdf";
        helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");

        // 3. Envoyer
        mailSender.send(message);
    }

    /**
     * Construit le corps HTML de l'email de facturation.
     */
    private String buildEmailBody(String clientNom, String factureNum, String totalTTC) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2rem; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 1.5rem;">Votre Facture</h1>
                </div>
                <div style="background: #f8fafc; padding: 2rem; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="font-size: 1rem; margin-top: 0;">Bonjour <strong>%s</strong>,</p>
                    <p>Veuillez trouver ci-joint votre facture n° <strong>%s</strong>.</p>
                    <div style="background: white; border-radius: 8px; padding: 1rem 1.5rem; border: 1px solid #e2e8f0; margin: 1.5rem 0;">
                        <table style="width: 100%%;">
                            <tr>
                                <td style="color: #64748b; font-size: 0.875rem;">Numéro de facture</td>
                                <td style="text-align: right; font-weight: 700;">%s</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 0.875rem; padding-top: 0.5rem;">Total TTC</td>
                                <td style="text-align: right; font-weight: 700; color: #6366f1; padding-top: 0.5rem;">%s TND</td>
                            </tr>
                        </table>
                    </div>
                    <p style="color: #64748b; font-size: 0.875rem;">
                        Pour toute question concernant cette facture, n'hésitez pas à nous contacter.
                    </p>
                    <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 0;">
                        Cordialement,<br>
                        <strong>L'équipe de facturation</strong>
                    </p>
                </div>
            </body>
            </html>
            """.formatted(clientNom, factureNum, factureNum, totalTTC);
    }
}
