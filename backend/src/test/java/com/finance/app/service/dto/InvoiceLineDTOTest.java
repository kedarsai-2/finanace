package com.finance.app.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class InvoiceLineDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(InvoiceLineDTO.class);
        InvoiceLineDTO invoiceLineDTO1 = new InvoiceLineDTO();
        invoiceLineDTO1.setId(1L);
        InvoiceLineDTO invoiceLineDTO2 = new InvoiceLineDTO();
        assertThat(invoiceLineDTO1).isNotEqualTo(invoiceLineDTO2);
        invoiceLineDTO2.setId(invoiceLineDTO1.getId());
        assertThat(invoiceLineDTO1).isEqualTo(invoiceLineDTO2);
        invoiceLineDTO2.setId(2L);
        assertThat(invoiceLineDTO1).isNotEqualTo(invoiceLineDTO2);
        invoiceLineDTO1.setId(null);
        assertThat(invoiceLineDTO1).isNotEqualTo(invoiceLineDTO2);
    }
}
