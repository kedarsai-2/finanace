package com.finance.app.domain;

import static com.finance.app.domain.AccountTestSamples.*;
import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.TransferTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class TransferTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Transfer.class);
        Transfer transfer1 = getTransferSample1();
        Transfer transfer2 = new Transfer();
        assertThat(transfer1).isNotEqualTo(transfer2);

        transfer2.setId(transfer1.getId());
        assertThat(transfer1).isEqualTo(transfer2);

        transfer2 = getTransferSample2();
        assertThat(transfer1).isNotEqualTo(transfer2);
    }

    @Test
    void businessTest() {
        Transfer transfer = getTransferRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        transfer.setBusiness(businessBack);
        assertThat(transfer.getBusiness()).isEqualTo(businessBack);

        transfer.business(null);
        assertThat(transfer.getBusiness()).isNull();
    }

    @Test
    void fromAccountTest() {
        Transfer transfer = getTransferRandomSampleGenerator();
        Account accountBack = getAccountRandomSampleGenerator();

        transfer.setFromAccount(accountBack);
        assertThat(transfer.getFromAccount()).isEqualTo(accountBack);

        transfer.fromAccount(null);
        assertThat(transfer.getFromAccount()).isNull();
    }

    @Test
    void toAccountTest() {
        Transfer transfer = getTransferRandomSampleGenerator();
        Account accountBack = getAccountRandomSampleGenerator();

        transfer.setToAccount(accountBack);
        assertThat(transfer.getToAccount()).isEqualTo(accountBack);

        transfer.toAccount(null);
        assertThat(transfer.getToAccount()).isNull();
    }
}
