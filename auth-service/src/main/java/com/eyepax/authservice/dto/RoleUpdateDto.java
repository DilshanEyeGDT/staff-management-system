package com.eyepax.authservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class RoleUpdateDto {
    private Set<String> roles;
}

