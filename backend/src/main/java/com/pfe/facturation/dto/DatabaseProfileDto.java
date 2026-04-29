package com.pfe.facturation.dto;

import lombok.Data;

@Data
public class DatabaseProfileDto {
    private String profileName;
    private String dbType;
    private String host;
    private Integer port;
    private String databaseName;
    private String username;
    private String password;
}
