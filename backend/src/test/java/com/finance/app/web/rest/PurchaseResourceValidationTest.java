package com.finance.app.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.finance.app.domain.Purchase;
import com.finance.app.domain.enumeration.PurchaseKind;
import com.finance.app.repository.PurchaseRepository;
import com.finance.app.service.PurchaseLineService;
import com.finance.app.service.PurchaseQueryService;
import com.finance.app.service.PurchaseService;
import com.finance.app.service.dto.PurchaseDTO;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PurchaseResourceValidationTest {

    private PurchaseResource purchaseResource;

    @BeforeEach
    void setUp() {
        purchaseResource =
            new PurchaseResource(
                mock(PurchaseService.class),
                mock(PurchaseRepository.class),
                mock(PurchaseQueryService.class),
                mock(PurchaseLineService.class)
            );
    }

    @Test
    void validatePurchasePayload_requiresCategoryForStandardPurchase() {
        PurchaseDTO dto = new PurchaseDTO();
        dto.setPurchaseKind(PurchaseKind.PURCHASE);

        assertThatThrownBy(() -> invokeValidatePurchasePayload(dto, null))
            .isInstanceOf(BadRequestAlertException.class)
            .extracting(ex -> ((BadRequestAlertException) ex).getErrorKey())
            .isEqualTo("purchasecategoryrequired");
    }

    @Test
    void validatePurchasePayload_normalizesValidCategoryForStandardPurchase() {
        PurchaseDTO dto = new PurchaseDTO();
        dto.setPurchaseKind(PurchaseKind.PURCHASE);
        dto.setPurchaseCategory(" long_term ");

        invokeValidatePurchasePayload(dto, null);

        assertThat(dto.getPurchaseCategory()).isEqualTo("LONG_TERM");
    }

    @Test
    void validatePurchasePayload_requiresSourceForReturnPurchase() {
        PurchaseDTO dto = new PurchaseDTO();
        dto.setPurchaseKind(PurchaseKind.RETURN);

        assertThatThrownBy(() -> invokeValidatePurchasePayload(dto, null))
            .isInstanceOf(BadRequestAlertException.class)
            .extracting(ex -> ((BadRequestAlertException) ex).getErrorKey())
            .isEqualTo("sourcepurchaserequired");
    }

    @Test
    void validatePurchasePayload_rejectsCategoryForReturnPurchase() {
        PurchaseDTO dto = new PurchaseDTO();
        dto.setPurchaseKind(PurchaseKind.RETURN);
        dto.setSourcePurchaseId(11L);
        dto.setPurchaseCategory("SHORT_TERM");

        assertThatThrownBy(() -> invokeValidatePurchasePayload(dto, null))
            .isInstanceOf(BadRequestAlertException.class)
            .extracting(ex -> ((BadRequestAlertException) ex).getErrorKey())
            .isEqualTo("purchasecategoryunexpected");
    }

    @Test
    void validatePurchasePatchPayload_normalizesProvidedCategoryForStandardPurchase() {
        Purchase existing = new Purchase();
        existing.setPurchaseKind(PurchaseKind.PURCHASE);
        existing.setPurchaseCategory("SHORT_TERM");

        PurchaseDTO patch = new PurchaseDTO();
        patch.setPurchaseCategory(" long_term ");

        invokeValidatePurchasePatchPayload(patch, existing, 99L);

        assertThat(patch.getPurchaseCategory()).isEqualTo("LONG_TERM");
    }

    @Test
    void validatePurchasePatchPayload_rejectsCategoryForReturnPurchase() {
        Purchase existing = new Purchase();
        existing.setId(99L);
        existing.setPurchaseKind(PurchaseKind.RETURN);
        existing.setPurchaseCategory("SHORT_TERM");
        Purchase src = new Purchase();
        src.setId(12L);
        existing.setSourcePurchase(src);

        PurchaseDTO patch = new PurchaseDTO();

        assertThatThrownBy(() -> invokeValidatePurchasePatchPayload(patch, existing, 99L))
            .isInstanceOf(BadRequestAlertException.class)
            .extracting(ex -> ((BadRequestAlertException) ex).getErrorKey())
            .isEqualTo("purchasecategoryunexpected");
    }

    private void invokeValidatePurchasePayload(PurchaseDTO dto, Long pathId) {
        invokePrivate("validatePurchasePayload", new Class<?>[] { PurchaseDTO.class, Long.class }, dto, pathId);
    }

    private void invokeValidatePurchasePatchPayload(PurchaseDTO dto, Purchase existing, Long pathId) {
        invokePrivate(
            "validatePurchasePatchPayload",
            new Class<?>[] { PurchaseDTO.class, Purchase.class, Long.class },
            dto,
            existing,
            pathId
        );
    }

    private void invokePrivate(String methodName, Class<?>[] paramTypes, Object... args) {
        try {
            Method m = PurchaseResource.class.getDeclaredMethod(methodName, paramTypes);
            m.setAccessible(true);
            m.invoke(purchaseResource, args);
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new RuntimeException(cause);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
