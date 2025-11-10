package com.eyepax.authservice.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class UpdateUserDto {
    @Size(max = 255)
    private String displayName;

    @Size(max = 100)
    private String username;
}


