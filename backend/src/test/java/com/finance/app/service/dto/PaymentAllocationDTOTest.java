package com.finance.app.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PaymentAllocationDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(PaymentAllocationDTO.class);
        PaymentAllocationDTO paymentAllocationDTO1 = new PaymentAllocationDTO();
        paymentAllocationDTO1.setId(1L);
        PaymentAllocationDTO paymentAllocationDTO2 = new PaymentAllocationDTO();
        assertThat(paymentAllocationDTO1).isNotEqualTo(paymentAllocationDTO2);
        paymentAllocationDTO2.setId(paymentAllocationDTO1.getId());
        assertThat(paymentAllocationDTO1).isEqualTo(paymentAllocationDTO2);
        paymentAllocationDTO2.setId(2L);
        assertThat(paymentAllocationDTO1).isNotEqualTo(paymentAllocationDTO2);
        paymentAllocationDTO1.setId(null);
        assertThat(paymentAllocationDTO1).isNotEqualTo(paymentAllocationDTO2);
    }
}
