package com.finance.app.domain;

import static com.finance.app.domain.AccountTestSamples.*;
import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.PartyTestSamples.*;
import static com.finance.app.domain.PaymentAllocationTestSamples.*;
import static com.finance.app.domain.PaymentTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class PaymentTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Payment.class);
        Payment payment1 = getPaymentSample1();
        Payment payment2 = new Payment();
        assertThat(payment1).isNotEqualTo(payment2);

        payment2.setId(payment1.getId());
        assertThat(payment1).isEqualTo(payment2);

        payment2 = getPaymentSample2();
        assertThat(payment1).isNotEqualTo(payment2);
    }

    @Test
    void allocationsTest() {
        Payment payment = getPaymentRandomSampleGenerator();
        PaymentAllocation paymentAllocationBack = getPaymentAllocationRandomSampleGenerator();

        payment.addAllocations(paymentAllocationBack);
        assertThat(payment.getAllocationses()).containsOnly(paymentAllocationBack);
        assertThat(paymentAllocationBack.getPayment()).isEqualTo(payment);

        payment.removeAllocations(paymentAllocationBack);
        assertThat(payment.getAllocationses()).doesNotContain(paymentAllocationBack);
        assertThat(paymentAllocationBack.getPayment()).isNull();

        payment.allocationses(new HashSet<>(Set.of(paymentAllocationBack)));
        assertThat(payment.getAllocationses()).containsOnly(paymentAllocationBack);
        assertThat(paymentAllocationBack.getPayment()).isEqualTo(payment);

        payment.setAllocationses(new HashSet<>());
        assertThat(payment.getAllocationses()).doesNotContain(paymentAllocationBack);
        assertThat(paymentAllocationBack.getPayment()).isNull();
    }

    @Test
    void businessTest() {
        Payment payment = getPaymentRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        payment.setBusiness(businessBack);
        assertThat(payment.getBusiness()).isEqualTo(businessBack);

        payment.business(null);
        assertThat(payment.getBusiness()).isNull();
    }

    @Test
    void partyTest() {
        Payment payment = getPaymentRandomSampleGenerator();
        Party partyBack = getPartyRandomSampleGenerator();

        payment.setParty(partyBack);
        assertThat(payment.getParty()).isEqualTo(partyBack);

        payment.party(null);
        assertThat(payment.getParty()).isNull();
    }

    @Test
    void accountTest() {
        Payment payment = getPaymentRandomSampleGenerator();
        Account accountBack = getAccountRandomSampleGenerator();

        payment.setAccount(accountBack);
        assertThat(payment.getAccount()).isEqualTo(accountBack);

        payment.account(null);
        assertThat(payment.getAccount()).isNull();
    }
}
