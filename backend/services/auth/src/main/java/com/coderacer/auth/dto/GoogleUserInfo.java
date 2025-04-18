package com.coderacer.auth.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class GoogleUserInfo {
    private String id;
    private String email;
    private String name;
    private String picture;
    private boolean verified_email;
}