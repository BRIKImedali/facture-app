package com.pfe.facturation.security.service;

import com.pfe.facturation.security.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Service de chargement de l'utilisateur depuis la base de données.
 *
 * Spring Security appelle loadUserByUsername() automatiquement
 * lors de chaque authentification pour vérifier que l'utilisateur existe.
 *
 * On lui passe l'email (notre "username") et il retourne le User
 * qui implémente UserDetails.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur non trouvé avec l'email : " + email
                ));
    }
}
