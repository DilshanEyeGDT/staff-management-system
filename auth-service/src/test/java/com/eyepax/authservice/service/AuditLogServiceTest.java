package com.eyepax.authservice.service;

import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.repository.AuditLogRepository;
import com.eyepax.authservice.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class AuditLogServiceTest {

    private AuditLogService auditLogService;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest httpServletRequest;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        auditLogService = new AuditLogService(auditLogRepository, userRepository);
    }

    @Test
    void testRecord_WithNullRequest_ShouldSaveAuditLog() {
        Long userId = 1L;
        String eventType = "LOGIN";
        String eventDesc = "User logged in";

        auditLogService.record(userId, eventType, eventDesc, null);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());
        AuditLog savedLog = captor.getValue();

        assertEquals(userId, savedLog.getUserId());
        assertEquals(eventType, savedLog.getEventType());
        assertEquals(eventDesc, savedLog.getEventDesc());
        assertNull(savedLog.getIpAddress());
        assertNull(savedLog.getUserAgent());
    }

    @Test
    void testRecord_WithHttpServletRequest_ShouldSaveAuditLogWithIpAndUserAgent() {
        Long userId = 2L;
        String eventType = "LOGOUT";
        String eventDesc = "User logged out";

        when(httpServletRequest.getRemoteAddr()).thenReturn("192.168.1.1");
        when(httpServletRequest.getHeader("User-Agent")).thenReturn("JUnit-Agent");

        auditLogService.record(userId, eventType, eventDesc, httpServletRequest);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());
        AuditLog savedLog = captor.getValue();

        assertEquals(userId, savedLog.getUserId());
        assertEquals(eventType, savedLog.getEventType());
        assertEquals(eventDesc, savedLog.getEventDesc());
        assertEquals("192.168.1.1", savedLog.getIpAddress());
        assertEquals("JUnit-Agent", savedLog.getUserAgent());
    }
}
