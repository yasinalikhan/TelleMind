package com.telemind.analytics.security;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private boolean enabled = true;

    public Long getId()              { return id; }
    public String getUsername()      { return username; }
    public String getPassword()      { return password; }
    public String getRole()          { return role; }
    public String getTenantId()      { return tenantId; }
    public boolean isEnabled()       { return enabled; }

    public void setId(Long id)               { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role)         { this.role = role; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public void setEnabled(boolean enabled)  { this.enabled = enabled; }
}
