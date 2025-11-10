package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.UpdateUserDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserDto getMe(Authentication authentication) {
        return userService.getCurrentUser(authentication);
    }

    @PatchMapping("/me")
    public UserDto updateMe(Authentication authentication,
            @RequestBody @Valid UpdateUserDto updateUserDto) {
        return userService.updateCurrentUser(authentication, updateUserDto);
    }

}
