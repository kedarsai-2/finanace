package com.finance.app.service.mapper;

import static com.finance.app.domain.TransferAsserts.*;
import static com.finance.app.domain.TransferTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TransferMapperTest {

    private TransferMapper transferMapper;

    @BeforeEach
    void setUp() {
        transferMapper = new TransferMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getTransferSample1();
        var actual = transferMapper.toEntity(transferMapper.toDto(expected));
        assertTransferAllPropertiesEquals(expected, actual);
    }
}
