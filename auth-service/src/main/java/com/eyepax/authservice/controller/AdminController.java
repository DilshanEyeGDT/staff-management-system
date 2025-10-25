package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.RoleUpdateDto;
import com.eyepax.authservice.dto.UserDetailDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public Page<UserDto> listUsers(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "10") int size,
                                   @RequestParam(defaultValue = "") String query) {
        return userService.getUsers(page, size, query);
    }

    @GetMapping("/users/{id}")
    public UserDetailDto getUser(@PathVariable Long id) {
        return userService.getUserDetails(id);
    }

    @PatchMapping("/users/{id}/roles")
    public UserDetailDto updateRoles(@PathVariable Long id, @RequestBody RoleUpdateDto dto) {
        return userService.updateUserRoles(id, dto.getRoles());
    }
}

