package com.finance.app.service.mapper;

import static com.finance.app.domain.PartyAsserts.*;
import static com.finance.app.domain.PartyTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PartyMapperTest {

    private PartyMapper partyMapper;

    @BeforeEach
    void setUp() {
        partyMapper = new PartyMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getPartySample1();
        var actual = partyMapper.toEntity(partyMapper.toDto(expected));
        assertPartyAllPropertiesEquals(expected, actual);
    }
}
