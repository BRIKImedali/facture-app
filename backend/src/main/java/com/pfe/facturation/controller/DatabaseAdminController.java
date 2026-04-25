package com.pfe.facturation.controller;

import com.pfe.facturation.dto.DatabaseProfileDto;
import com.pfe.facturation.service.DatabasePropertiesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/database")
@RequiredArgsConstructor
public class DatabaseAdminController {

    private final DatabasePropertiesService propertiesService;

    @PostMapping("/generate-properties")
    public ResponseEntity<String> generateProperties(@RequestBody DatabaseProfileDto dto) {
        propertiesService.generatePropertiesFile(dto);
        return ResponseEntity.ok("File application-" + dto.getProfileName() + ".properties successfully generated and activated.");
    }
}
