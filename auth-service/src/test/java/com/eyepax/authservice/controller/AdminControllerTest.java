package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.RoleUpdateDto;
import com.eyepax.authservice.dto.UserDetailDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.model.Role;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminController adminController;

    @Captor
    private ArgumentCaptor<Set<String>> rolesCaptor;

    private User user;
    private UserDto userDto;
    private UserDetailDto userDetailDto;

    @BeforeEach
    public void setup() {
        Role role = new Role(1L, "USER", "Default role", null);
        Set<Role> roleSet = new HashSet<>();
        roleSet.add(role);

        user = new User(1L, "cognito-sub-123", "john", "john@example.com", "John Doe",
                "ACTIVE", null, null, null, roleSet);

        userDto = new UserDto(1L, "john", "john@example.com", "John Doe", Set.of("USER"));
        userDetailDto = new UserDetailDto(user, List.of(new AuditLog()));
    }

    @Test
    public void testListUsersReturnsPagedUsers() {
        Page<UserDto> page = new PageImpl<>(List.of(userDto));
        when(userService.getUsers(0, 10, "")).thenReturn(page);

        Page<UserDto> result = adminController.listUsers(0, 10, "");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUsername()).isEqualTo("john");
        verify(userService, times(1)).getUsers(0, 10, "");
    }

    @Test
    public void testGetUserReturnsUserDetailDto() {
        when(userService.getUserDetails(1L)).thenReturn(userDetailDto);

        UserDetailDto result = adminController.getUser(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUsername()).isEqualTo("john");
        assertThat(result.getRoles()).contains("USER");
        verify(userService, times(1)).getUserDetails(1L);
    }

    @Test
    public void testUpdateRolesCallsUserService() {
        RoleUpdateDto dto = new RoleUpdateDto();
        dto.setRoles(Set.of("Admin"));

        when(userService.updateUserRoles(eq(1L), any())).thenReturn(userDetailDto);

        UserDetailDto result = adminController.updateRoles(1L, dto);

        assertThat(result.getId()).isEqualTo(1L);
        verify(userService, times(1)).updateUserRoles(eq(1L), rolesCaptor.capture());
        assertThat(rolesCaptor.getValue()).contains("Admin");
    }
}
