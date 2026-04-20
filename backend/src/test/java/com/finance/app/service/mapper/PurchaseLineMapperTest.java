package com.finance.app.service.mapper;

import static com.finance.app.domain.PurchaseLineAsserts.*;
import static com.finance.app.domain.PurchaseLineTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PurchaseLineMapperTest {

    private PurchaseLineMapper purchaseLineMapper;

    @BeforeEach
    void setUp() {
        purchaseLineMapper = new PurchaseLineMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getPurchaseLineSample1();
        var actual = purchaseLineMapper.toEntity(purchaseLineMapper.toDto(expected));
        assertPurchaseLineAllPropertiesEquals(expected, actual);
    }
}
