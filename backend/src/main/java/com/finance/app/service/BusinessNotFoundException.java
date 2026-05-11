package com.finance.app.service;

import java.io.Serial;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BusinessNotFoundException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    public BusinessNotFoundException(Long businessId) {
        super("Business not found for id: " + businessId);
    }
}
