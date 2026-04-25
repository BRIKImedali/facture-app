package com.pfe.facturation.security.service;

import com.pfe.facturation.security.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Service de chargement de l'utilisateur depuis la base de données.
 *
 * Spring Security appelle loadUserByUsername() automatiquement lors de chaque
 * authentification. On lui passe le username (identifiant de connexion) et il
 * retourne le User qui implémente UserDetails.
 *
 * Changement v2 : on recherche par username et non plus par email.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur non trouvé : " + username
                ));
    }
}
