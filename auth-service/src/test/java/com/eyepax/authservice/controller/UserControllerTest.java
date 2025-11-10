package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.UpdateUserDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testGetMe_ShouldReturnUserDto() throws Exception {
        // Prepare mock data
        UserDto userDto = new UserDto(1L, "john.doe", "john@example.com", "John Doe", Set.of("USER"));

        when(authentication.getName()).thenReturn("mockCognitoSub");
        when(userService.getCurrentUser(authentication)).thenReturn(userDto);

        mockMvc.perform(get("/api/v1/me")
                .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.username").value("john.doe"))
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.displayName").value("John Doe"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }

    @Test
    void testUpdateMe_ShouldReturnUpdatedUserDto() throws Exception {
        // Prepare mock input and output
        UpdateUserDto updateUserDto = new UpdateUserDto();
        updateUserDto.setUsername("johnny");
        updateUserDto.setDisplayName("Johnny Doe");

        UserDto updatedUserDto = new UserDto(1L, "johnny", "john@example.com", "Johnny Doe", Set.of("USER"));

        when(authentication.getName()).thenReturn("mockCognitoSub");
        when(userService.updateCurrentUser(any(Authentication.class), any(UpdateUserDto.class)))
                .thenReturn(updatedUserDto);

        mockMvc.perform(patch("/api/v1/me")
                .principal(authentication)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateUserDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.username").value("johnny"))
                .andExpect(jsonPath("$.displayName").value("Johnny Doe"))
                .andExpect(jsonPath("$.roles[0]").value("USER"));
    }
}
