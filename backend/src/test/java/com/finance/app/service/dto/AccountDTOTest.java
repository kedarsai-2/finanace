package com.finance.app.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class AccountDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(AccountDTO.class);
        AccountDTO accountDTO1 = new AccountDTO();
        accountDTO1.setId(1L);
        AccountDTO accountDTO2 = new AccountDTO();
        assertThat(accountDTO1).isNotEqualTo(accountDTO2);
        accountDTO2.setId(accountDTO1.getId());
        assertThat(accountDTO1).isEqualTo(accountDTO2);
        accountDTO2.setId(2L);
        assertThat(accountDTO1).isNotEqualTo(accountDTO2);
        accountDTO1.setId(null);
        assertThat(accountDTO1).isNotEqualTo(accountDTO2);
    }
}
