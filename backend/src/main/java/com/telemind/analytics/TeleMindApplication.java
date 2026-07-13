package com.telemind.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class TeleMindApplication {
    public static void main(String[] args) {
        SpringApplication.run(TeleMindApplication.class, args);
    }
}
