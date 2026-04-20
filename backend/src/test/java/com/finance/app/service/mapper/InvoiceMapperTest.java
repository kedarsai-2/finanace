package com.finance.app.service.mapper;

import static com.finance.app.domain.InvoiceAsserts.*;
import static com.finance.app.domain.InvoiceTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InvoiceMapperTest {

    private InvoiceMapper invoiceMapper;

    @BeforeEach
    void setUp() {
        invoiceMapper = new InvoiceMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getInvoiceSample1();
        var actual = invoiceMapper.toEntity(invoiceMapper.toDto(expected));
        assertInvoiceAllPropertiesEquals(expected, actual);
    }
}
