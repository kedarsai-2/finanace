package com.finance.app.service.mapper;

import static com.finance.app.domain.InvoiceLineAsserts.*;
import static com.finance.app.domain.InvoiceLineTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InvoiceLineMapperTest {

    private InvoiceLineMapper invoiceLineMapper;

    @BeforeEach
    void setUp() {
        invoiceLineMapper = new InvoiceLineMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getInvoiceLineSample1();
        var actual = invoiceLineMapper.toEntity(invoiceLineMapper.toDto(expected));
        assertInvoiceLineAllPropertiesEquals(expected, actual);
    }
}
