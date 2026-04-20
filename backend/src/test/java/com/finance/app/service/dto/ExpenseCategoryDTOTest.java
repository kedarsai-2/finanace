package com.finance.app.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ExpenseCategoryDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ExpenseCategoryDTO.class);
        ExpenseCategoryDTO expenseCategoryDTO1 = new ExpenseCategoryDTO();
        expenseCategoryDTO1.setId(1L);
        ExpenseCategoryDTO expenseCategoryDTO2 = new ExpenseCategoryDTO();
        assertThat(expenseCategoryDTO1).isNotEqualTo(expenseCategoryDTO2);
        expenseCategoryDTO2.setId(expenseCategoryDTO1.getId());
        assertThat(expenseCategoryDTO1).isEqualTo(expenseCategoryDTO2);
        expenseCategoryDTO2.setId(2L);
        assertThat(expenseCategoryDTO1).isNotEqualTo(expenseCategoryDTO2);
        expenseCategoryDTO1.setId(null);
        assertThat(expenseCategoryDTO1).isNotEqualTo(expenseCategoryDTO2);
    }
}
