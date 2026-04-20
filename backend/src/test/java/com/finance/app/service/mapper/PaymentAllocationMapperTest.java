package com.finance.app.service.mapper;

import static com.finance.app.domain.PaymentAllocationAsserts.*;
import static com.finance.app.domain.PaymentAllocationTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PaymentAllocationMapperTest {

    private PaymentAllocationMapper paymentAllocationMapper;

    @BeforeEach
    void setUp() {
        paymentAllocationMapper = new PaymentAllocationMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getPaymentAllocationSample1();
        var actual = paymentAllocationMapper.toEntity(paymentAllocationMapper.toDto(expected));
        assertPaymentAllocationAllPropertiesEquals(expected, actual);
    }
}
