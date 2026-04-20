package com.finance.app.service.mapper;

import static com.finance.app.domain.AccountAsserts.*;
import static com.finance.app.domain.AccountTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AccountMapperTest {

    private AccountMapper accountMapper;

    @BeforeEach
    void setUp() {
        accountMapper = new AccountMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getAccountSample1();
        var actual = accountMapper.toEntity(accountMapper.toDto(expected));
        assertAccountAllPropertiesEquals(expected, actual);
    }
}
