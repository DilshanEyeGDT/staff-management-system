package com.eyepax.authservice.controller;

import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuditControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditController auditController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(auditController).build();
    }

    @Test
    void testGetAuditLogs_ReturnsAuditLogList() throws Exception {
        AuditLog log1 = new AuditLog(1L, 101L, "LOGIN", "User logged in", "127.0.0.1", "JUnit", Instant.now());
        AuditLog log2 = new AuditLog(2L, 102L, "LOGOUT", "User logged out", "127.0.0.2", "JUnit", Instant.now());
        List<AuditLog> logs = Arrays.asList(log1, log2);

        when(auditLogRepository.findAll()).thenReturn(logs);

        mockMvc.perform(get("/api/v1/admin/audit-log")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(logs.size()))
                .andExpect(jsonPath("$[0].id").value(log1.getId()))
                .andExpect(jsonPath("$[0].eventType").value("LOGIN"))
                .andExpect(jsonPath("$[1].id").value(log2.getId()))
                .andExpect(jsonPath("$[1].eventType").value("LOGOUT"));
    }
}
