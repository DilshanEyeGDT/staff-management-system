package com.eyepax.authservice.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

public class HealthControllerTest {

    private final HealthController healthController = new HealthController();

    @Test
    public void testHealthEndpointReturnsOk() {
        ResponseEntity<String> response = healthController.health();

        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("OK");
    }
}
