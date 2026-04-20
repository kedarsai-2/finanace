package com.finance.app.domain;

import static com.finance.app.domain.PaymentAllocationTestSamples.*;
import static com.finance.app.domain.PaymentTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PaymentAllocationTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(PaymentAllocation.class);
        PaymentAllocation paymentAllocation1 = getPaymentAllocationSample1();
        PaymentAllocation paymentAllocation2 = new PaymentAllocation();
        assertThat(paymentAllocation1).isNotEqualTo(paymentAllocation2);

        paymentAllocation2.setId(paymentAllocation1.getId());
        assertThat(paymentAllocation1).isEqualTo(paymentAllocation2);

        paymentAllocation2 = getPaymentAllocationSample2();
        assertThat(paymentAllocation1).isNotEqualTo(paymentAllocation2);
    }

    @Test
    void paymentTest() {
        PaymentAllocation paymentAllocation = getPaymentAllocationRandomSampleGenerator();
        Payment paymentBack = getPaymentRandomSampleGenerator();

        paymentAllocation.setPayment(paymentBack);
        assertThat(paymentAllocation.getPayment()).isEqualTo(paymentBack);

        paymentAllocation.payment(null);
        assertThat(paymentAllocation.getPayment()).isNull();
    }
}
