package com.finance.app.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PurchaseLineDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(PurchaseLineDTO.class);
        PurchaseLineDTO purchaseLineDTO1 = new PurchaseLineDTO();
        purchaseLineDTO1.setId(1L);
        PurchaseLineDTO purchaseLineDTO2 = new PurchaseLineDTO();
        assertThat(purchaseLineDTO1).isNotEqualTo(purchaseLineDTO2);
        purchaseLineDTO2.setId(purchaseLineDTO1.getId());
        assertThat(purchaseLineDTO1).isEqualTo(purchaseLineDTO2);
        purchaseLineDTO2.setId(2L);
        assertThat(purchaseLineDTO1).isNotEqualTo(purchaseLineDTO2);
        purchaseLineDTO1.setId(null);
        assertThat(purchaseLineDTO1).isNotEqualTo(purchaseLineDTO2);
    }
}
