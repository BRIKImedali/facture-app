// EncryptionUtil.java — Utilitaire de chiffrement/déchiffrement AES-256
package com.pfe.facturation.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utilitaire de chiffrement AES-256-GCM pour sécuriser les credentials.
 * Utilise AES-256 en mode GCM (Galois/Counter Mode) qui offre :
 * - Confidentialité (chiffrement)
 * - Intégrité (authentification des données)
 * - IV aléatoire à chaque chiffrement pour éviter les attaques par rejeu
 */
@Component
public class EncryptionUtil {

    private static final Logger log = LoggerFactory.getLogger(EncryptionUtil.class);

    // Algorithme AES-GCM avec 256 bits
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;    // 96 bits IV standard pour GCM
    private static final int GCM_TAG_LENGTH = 16;   // 128 bits tag d'authentification

    @Value("${app.encryption.secret-key:DefaultSecretKey123456789012345}")
    private String secretKeyString;

    /**
     * Dérive une clé AES-256 à partir de la chaîne de configuration.
     * Utilise SHA-256 pour garantir exactement 256 bits.
     */
    private SecretKey getSecretKey() {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(secretKeyString.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la création de la clé AES", e);
        }
    }

    /**
     * Chiffre une valeur en clair avec AES-256-GCM.
     * Le résultat est encodé en Base64 pour stockage en base de données.
     * Format : [IV 12 bytes][Données chiffrées + Tag GCM]
     *
     * @param plaintext La valeur en clair à chiffrer
     * @return La valeur chiffrée encodée en Base64
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        try {
            // Générer un IV aléatoire unique pour chaque chiffrement
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey(), parameterSpec);

            byte[] encryptedData = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Concaténer IV + données chiffrées
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedData.length);
            byteBuffer.put(iv);
            byteBuffer.put(encryptedData);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Erreur lors du chiffrement : {}", e.getMessage());
            throw new RuntimeException("Erreur lors du chiffrement des données", e);
        }
    }

    /**
     * Déchiffre une valeur chiffrée avec AES-256-GCM.
     *
     * @param encryptedBase64 La valeur chiffrée encodée en Base64
     * @return La valeur en clair
     */
    public String decrypt(String encryptedBase64) {
        if (encryptedBase64 == null || encryptedBase64.isEmpty()) {
            return encryptedBase64;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedBase64);

            // Extraire l'IV (12 premiers bytes)
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            // Extraire les données chiffrées
            byte[] encryptedData = new byte[byteBuffer.remaining()];
            byteBuffer.get(encryptedData);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), parameterSpec);

            byte[] decryptedData = cipher.doFinal(encryptedData);
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Erreur lors du déchiffrement : {}", e.getMessage());
            throw new RuntimeException("Erreur lors du déchiffrement des données", e);
        }
    }

    /**
     * Masque un mot de passe pour l'affichage (remplace par des étoiles).
     *
     * @param password Le mot de passe à masquer
     * @return Le mot de passe masqué (ex: "****")
     */
    public String maskPassword(String password) {
        if (password == null || password.isEmpty()) {
            return "";
        }
        return "*".repeat(Math.min(password.length(), 8));
    }
}
