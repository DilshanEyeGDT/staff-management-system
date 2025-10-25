package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.UpdateUserDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

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

//    // ✅ JWT-aware /me endpoint
//    @GetMapping("/me")
//    public ResponseEntity<?> getMe(Authentication authentication) {
//        if (authentication == null || !authentication.isAuthenticated()) {
//            return ResponseEntity.status(401).body("Not authenticated");
//        }
//
//        String cognitoSub = authentication.getName(); // this will now come from the JWT principal
//        User user = userService.getUserByCognitoSub(cognitoSub);
//
//        UserDto dto = new UserDto();
//        dto.setId(user.getId());
//        dto.setUsername(user.getUsername());
//        dto.setEmail(user.getEmail());
//        dto.setDisplayName(user.getDisplayName());
//        dto.setRoles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()));
//
//        return ResponseEntity.ok(dto);
//    }

    @PatchMapping("/me")
    public UserDto updateMe(Authentication authentication,
                            @RequestBody @Valid UpdateUserDto updateUserDto) {
        return userService.updateCurrentUser(authentication, updateUserDto);
    }

}
