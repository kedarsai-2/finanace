package com.finance.app.domain;

import static com.finance.app.domain.AccountTestSamples.*;
import static com.finance.app.domain.BusinessTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class AccountTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Account.class);
        Account account1 = getAccountSample1();
        Account account2 = new Account();
        assertThat(account1).isNotEqualTo(account2);

        account2.setId(account1.getId());
        assertThat(account1).isEqualTo(account2);

        account2 = getAccountSample2();
        assertThat(account1).isNotEqualTo(account2);
    }

    @Test
    void businessTest() {
        Account account = getAccountRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        account.setBusiness(businessBack);
        assertThat(account.getBusiness()).isEqualTo(businessBack);

        account.business(null);
        assertThat(account.getBusiness()).isNull();
    }
}
