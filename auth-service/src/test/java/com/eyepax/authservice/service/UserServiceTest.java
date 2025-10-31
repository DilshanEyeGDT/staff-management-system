package com.eyepax.authservice.service;

import com.eyepax.authservice.dto.UpdateUserDto;
import com.eyepax.authservice.dto.UserDetailDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.model.Role;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.repository.AuditLogRepository;
import com.eyepax.authservice.repository.RoleRepository;
import com.eyepax.authservice.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import org.springframework.security.core.Authentication;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserService userService;

    private User mockUser;
    private Role mockRole;
    private AuditLog mockAuditLog;

    @BeforeEach
    void setup() {
        mockRole = new Role();
        mockRole.setId(1L);
        mockRole.setName("EMPLOYEE");

        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("john.doe");
        mockUser.setEmail("john@example.com");
        mockUser.setDisplayName("John Doe");
        mockUser.setCognitoSub("abc123");
        mockUser.setRoles(new HashSet<>(Set.of(mockRole)));

        mockAuditLog = new AuditLog();
        mockAuditLog.setId(1L);
        mockAuditLog.setUserId(mockUser.getId());
        mockAuditLog.setEventType("LOGIN");
        mockAuditLog.setEventDesc("User logged in");
    }

    // ==================== getCurrentUser ====================
    @Test
    @DisplayName("getCurrentUser returns correct UserDto")
    void getCurrentUser_returnsCorrectUserDto() {
        when(authentication.getName()).thenReturn("abc123");
        when(userRepository.findByCognitoSub("abc123")).thenReturn(Optional.of(mockUser));

        UserDto dto = userService.getCurrentUser(authentication);

        assertNotNull(dto);
        assertEquals(mockUser.getId(), dto.getId());
        assertEquals(mockUser.getUsername(), dto.getUsername());
        assertEquals(mockUser.getEmail(), dto.getEmail());
        assertEquals(mockUser.getDisplayName(), dto.getDisplayName());
        assertTrue(dto.getRoles().contains("EMPLOYEE"));
    }

    @Test
    @DisplayName("getCurrentUser throws exception if user not found")
    void getCurrentUser_throwsIfUserNotFound() {
        when(authentication.getName()).thenReturn("xyz999");
        when(userRepository.findByCognitoSub("xyz999")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userService.getCurrentUser(authentication));
        assertEquals("User not found", exception.getMessage());
    }

    // ==================== updateCurrentUser ====================
    @Test
    @DisplayName("updateCurrentUser updates and returns updated UserDto")
    void updateCurrentUser_updatesAndReturnsUpdatedUserDto() {
        when(authentication.getName()).thenReturn("abc123");
        when(userRepository.findByCognitoSub("abc123")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UpdateUserDto updateDto = new UpdateUserDto();
        updateDto.setUsername("new.username");
        updateDto.setDisplayName("New Name");

        UserDto updated = userService.updateCurrentUser(authentication, updateDto);

        assertEquals("new.username", updated.getUsername());
        assertEquals("New Name", updated.getDisplayName());
        assertEquals(mockUser.getEmail(), updated.getEmail());
        assertTrue(updated.getRoles().contains("EMPLOYEE"));
    }

    @Test
    @DisplayName("updateCurrentUser throws exception if user not found")
    void updateCurrentUser_throwsIfUserNotFound() {
        when(authentication.getName()).thenReturn("abc123");
        when(userRepository.findByCognitoSub("abc123")).thenReturn(Optional.empty());

        UpdateUserDto updateDto = new UpdateUserDto();

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.updateCurrentUser(authentication, updateDto));
        assertEquals("User not found", ex.getMessage());
    }

    // ==================== getUsers ====================
    @Test
    @DisplayName("getUsers returns paged results without query")
    void getUsers_returnsPagedResultsWithoutQuery() {
        Page<User> page = new PageImpl<>(List.of(mockUser));
        when(userRepository.findAll(PageRequest.of(0, 10))).thenReturn(page);

        Page<UserDto> result = userService.getUsers(0, 10, null);

        assertEquals(1, result.getTotalElements());
        assertEquals(mockUser.getUsername(), result.getContent().get(0).getUsername());
    }

    @Test
    @DisplayName("getUsers returns paged results with query")
    void getUsers_returnsPagedResultsWithQuery() {
        Page<User> page = new PageImpl<>(List.of(mockUser));
        when(userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase("john", "john",
                PageRequest.of(0, 10)))
                .thenReturn(page);

        Page<UserDto> result = userService.getUsers(0, 10, "john");

        assertEquals(1, result.getTotalElements());
        assertEquals(mockUser.getUsername(), result.getContent().get(0).getUsername());
    }

    // ==================== getUserDetails ====================
    @Test
    @DisplayName("getUserDetails returns UserDetailDto with audit logs")
    void getUserDetails_returnsUserDetailDtoWithAuditLogs() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(auditLogRepository.findByUserId(1L)).thenReturn(List.of(mockAuditLog));

        UserDetailDto dto = userService.getUserDetails(1L);

        assertEquals(mockUser.getId(), dto.getId());
        assertEquals(mockUser.getUsername(), dto.getUsername());
        assertEquals(1, dto.getAuditLogs().size());
        assertEquals("LOGIN", dto.getAuditLogs().get(0).getEventType());
    }

    @Test
    @DisplayName("getUserDetails throws exception if user not found")
    void getUserDetails_throwsIfUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.getUserDetails(999L));
        assertEquals("User not found", ex.getMessage());
    }

    // ==================== updateUserRoles ====================
    @Test
    @DisplayName("updateUserRoles updates roles and records audit log")
    void updateUserRoles_updatesRolesAndRecordsAuditLog() {
        Role roleAdmin = new Role();
        roleAdmin.setId(2L);
        roleAdmin.setName("ADMIN");

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(roleAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(auditLogRepository.findByUserId(1L)).thenReturn(List.of(mockAuditLog));

        Set<String> newRoles = Set.of("ADMIN");

        UserDetailDto dto = userService.updateUserRoles(1L, newRoles);

        assertEquals(1, dto.getRoles().size());
        assertTrue(dto.getRoles().contains("ADMIN"));
        verify(auditLogService, times(1)).record(eq(1L), eq("ROLE_UPDATE"), anyString(), isNull());
    }

    @Test
    @DisplayName("updateUserRoles throws exception if role not found")
    void updateUserRoles_throwsIfRoleNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findByName("UNKNOWN")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.updateUserRoles(1L, Set.of("UNKNOWN")));
        assertTrue(ex.getMessage().contains("Role not found"));
    }

    // ==================== getUserByCognitoSub ====================
    @Test
    @DisplayName("getUserByCognitoSub returns User if exists")
    void getUserByCognitoSub_returnsUserIfExists() {
        when(userRepository.findByCognitoSub("abc123")).thenReturn(Optional.of(mockUser));

        User u = userService.getUserByCognitoSub("abc123");
        assertEquals(mockUser.getUsername(), u.getUsername());
    }

    @Test
    @DisplayName("getUserByCognitoSub throws exception if user not found")
    void getUserByCognitoSub_throwsIfUserNotFound() {
        when(userRepository.findByCognitoSub("unknown")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.getUserByCognitoSub("unknown"));
        assertEquals("User not found", ex.getMessage());
    }
}
