package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.RoleUpdateDto;
import com.eyepax.authservice.dto.UserDetailDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/users")
    public Page<UserDto> listUsers(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String query) {
        return userService.getUsers(page, size, query);
    }

    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/users/{id}")
    public UserDetailDto getUser(@PathVariable Long id) {
        return userService.getUserDetails(id);
    }

    @PreAuthorize("hasAuthority('Admin')")
    @PatchMapping("/users/{id}/roles")
    public UserDetailDto updateRoles(@PathVariable Long id, @RequestBody RoleUpdateDto dto) {
        return userService.updateUserRoles(id, dto.getRoles());
    }
}
