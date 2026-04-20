package com.finance.app.web.rest;

import static com.finance.app.domain.PurchaseLineAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Purchase;
import com.finance.app.domain.PurchaseLine;
import com.finance.app.domain.enumeration.DiscountKind;
import com.finance.app.repository.PurchaseLineRepository;
import com.finance.app.service.PurchaseLineService;
import com.finance.app.service.dto.PurchaseLineDTO;
import com.finance.app.service.mapper.PurchaseLineMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link PurchaseLineResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class PurchaseLineResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_QTY = new BigDecimal(0);
    private static final BigDecimal UPDATED_QTY = new BigDecimal(1);

    private static final String DEFAULT_UNIT = "AAAAAAAAAA";
    private static final String UPDATED_UNIT = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_RATE = new BigDecimal(0);
    private static final BigDecimal UPDATED_RATE = new BigDecimal(1);

    private static final DiscountKind DEFAULT_DISCOUNT_KIND = DiscountKind.PERCENT;
    private static final DiscountKind UPDATED_DISCOUNT_KIND = DiscountKind.AMOUNT;

    private static final BigDecimal DEFAULT_DISCOUNT_VALUE = new BigDecimal(0);
    private static final BigDecimal UPDATED_DISCOUNT_VALUE = new BigDecimal(1);

    private static final BigDecimal DEFAULT_TAX_PERCENT = new BigDecimal(0);
    private static final BigDecimal UPDATED_TAX_PERCENT = new BigDecimal(1);

    private static final Integer DEFAULT_LINE_ORDER = 0;
    private static final Integer UPDATED_LINE_ORDER = 1;

    private static final String ENTITY_API_URL = "/api/purchase-lines";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PurchaseLineRepository purchaseLineRepository;

    @Mock
    private PurchaseLineRepository purchaseLineRepositoryMock;

    @Autowired
    private PurchaseLineMapper purchaseLineMapper;

    @Mock
    private PurchaseLineService purchaseLineServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPurchaseLineMockMvc;

    private PurchaseLine purchaseLine;

    private PurchaseLine insertedPurchaseLine;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PurchaseLine createEntity(EntityManager em) {
        PurchaseLine purchaseLine = new PurchaseLine()
            .name(DEFAULT_NAME)
            .qty(DEFAULT_QTY)
            .unit(DEFAULT_UNIT)
            .rate(DEFAULT_RATE)
            .discountKind(DEFAULT_DISCOUNT_KIND)
            .discountValue(DEFAULT_DISCOUNT_VALUE)
            .taxPercent(DEFAULT_TAX_PERCENT)
            .lineOrder(DEFAULT_LINE_ORDER);
        // Add required entity
        Purchase purchase;
        if (TestUtil.findAll(em, Purchase.class).isEmpty()) {
            purchase = PurchaseResourceIT.createEntity();
            em.persist(purchase);
            em.flush();
        } else {
            purchase = TestUtil.findAll(em, Purchase.class).get(0);
        }
        purchaseLine.setPurchase(purchase);
        return purchaseLine;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PurchaseLine createUpdatedEntity(EntityManager em) {
        PurchaseLine updatedPurchaseLine = new PurchaseLine()
            .name(UPDATED_NAME)
            .qty(UPDATED_QTY)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .discountKind(UPDATED_DISCOUNT_KIND)
            .discountValue(UPDATED_DISCOUNT_VALUE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);
        // Add required entity
        Purchase purchase;
        if (TestUtil.findAll(em, Purchase.class).isEmpty()) {
            purchase = PurchaseResourceIT.createUpdatedEntity();
            em.persist(purchase);
            em.flush();
        } else {
            purchase = TestUtil.findAll(em, Purchase.class).get(0);
        }
        updatedPurchaseLine.setPurchase(purchase);
        return updatedPurchaseLine;
    }

    @BeforeEach
    void initTest() {
        purchaseLine = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedPurchaseLine != null) {
            purchaseLineRepository.delete(insertedPurchaseLine);
            insertedPurchaseLine = null;
        }
    }

    @Test
    @Transactional
    void createPurchaseLine() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);
        var returnedPurchaseLineDTO = om.readValue(
            restPurchaseLineMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PurchaseLineDTO.class
        );

        // Validate the PurchaseLine in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPurchaseLine = purchaseLineMapper.toEntity(returnedPurchaseLineDTO);
        assertPurchaseLineUpdatableFieldsEquals(returnedPurchaseLine, getPersistedPurchaseLine(returnedPurchaseLine));

        insertedPurchaseLine = returnedPurchaseLine;
    }

    @Test
    @Transactional
    void createPurchaseLineWithExistingId() throws Exception {
        // Create the PurchaseLine with an existing ID
        purchaseLine.setId(1L);
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setName(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkQtyIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setQty(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkUnitIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setUnit(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkRateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setRate(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDiscountKindIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setDiscountKind(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDiscountValueIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setDiscountValue(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTaxPercentIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        purchaseLine.setTaxPercent(null);

        // Create the PurchaseLine, which fails.
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        restPurchaseLineMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPurchaseLines() throws Exception {
        // Initialize the database
        insertedPurchaseLine = purchaseLineRepository.saveAndFlush(purchaseLine);

        // Get all the purchaseLineList
        restPurchaseLineMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(purchaseLine.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].qty").value(hasItem(sameNumber(DEFAULT_QTY))))
            .andExpect(jsonPath("$.[*].unit").value(hasItem(DEFAULT_UNIT)))
            .andExpect(jsonPath("$.[*].rate").value(hasItem(sameNumber(DEFAULT_RATE))))
            .andExpect(jsonPath("$.[*].discountKind").value(hasItem(DEFAULT_DISCOUNT_KIND.toString())))
            .andExpect(jsonPath("$.[*].discountValue").value(hasItem(sameNumber(DEFAULT_DISCOUNT_VALUE))))
            .andExpect(jsonPath("$.[*].taxPercent").value(hasItem(sameNumber(DEFAULT_TAX_PERCENT))))
            .andExpect(jsonPath("$.[*].lineOrder").value(hasItem(DEFAULT_LINE_ORDER)));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllPurchaseLinesWithEagerRelationshipsIsEnabled() throws Exception {
        when(purchaseLineServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restPurchaseLineMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(purchaseLineServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllPurchaseLinesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(purchaseLineServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restPurchaseLineMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(purchaseLineRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getPurchaseLine() throws Exception {
        // Initialize the database
        insertedPurchaseLine = purchaseLineRepository.saveAndFlush(purchaseLine);

        // Get the purchaseLine
        restPurchaseLineMockMvc
            .perform(get(ENTITY_API_URL_ID, purchaseLine.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(purchaseLine.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.qty").value(sameNumber(DEFAULT_QTY)))
            .andExpect(jsonPath("$.unit").value(DEFAULT_UNIT))
            .andExpect(jsonPath("$.rate").value(sameNumber(DEFAULT_RATE)))
            .andExpect(jsonPath("$.discountKind").value(DEFAULT_DISCOUNT_KIND.toString()))
            .andExpect(jsonPath("$.discountValue").value(sameNumber(DEFAULT_DISCOUNT_VALUE)))
            .andExpect(jsonPath("$.taxPercent").value(sameNumber(DEFAULT_TAX_PERCENT)))
            .andExpect(jsonPath("$.lineOrder").value(DEFAULT_LINE_ORDER));
    }

    @Test
    @Transactional
    void getNonExistingPurchaseLine() throws Exception {
        // Get the purchaseLine
        restPurchaseLineMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPurchaseLine() throws Exception {
        // Initialize the database
        insertedPurchaseLine = purchaseLineRepository.saveAndFlush(purchaseLine);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the purchaseLine
        PurchaseLine updatedPurchaseLine = purchaseLineRepository.findById(purchaseLine.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPurchaseLine are not directly saved in db
        em.detach(updatedPurchaseLine);
        updatedPurchaseLine
            .name(UPDATED_NAME)
            .qty(UPDATED_QTY)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .discountKind(UPDATED_DISCOUNT_KIND)
            .discountValue(UPDATED_DISCOUNT_VALUE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(updatedPurchaseLine);

        restPurchaseLineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, purchaseLineDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(purchaseLineDTO))
            )
            .andExpect(status().isOk());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPurchaseLineToMatchAllProperties(updatedPurchaseLine);
    }

    @Test
    @Transactional
    void putNonExistingPurchaseLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchaseLine.setId(longCount.incrementAndGet());

        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPurchaseLineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, purchaseLineDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(purchaseLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPurchaseLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchaseLine.setId(longCount.incrementAndGet());

        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseLineMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(purchaseLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPurchaseLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchaseLine.setId(longCount.incrementAndGet());

        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseLineMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePurchaseLineWithPatch() throws Exception {
        // Initialize the database
        insertedPurchaseLine = purchaseLineRepository.saveAndFlush(purchaseLine);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the purchaseLine using partial update
        PurchaseLine partialUpdatedPurchaseLine = new PurchaseLine();
        partialUpdatedPurchaseLine.setId(purchaseLine.getId());

        partialUpdatedPurchaseLine
            .name(UPDATED_NAME)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);

        restPurchaseLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPurchaseLine.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPurchaseLine))
            )
            .andExpect(status().isOk());

        // Validate the PurchaseLine in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPurchaseLineUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedPurchaseLine, purchaseLine),
            getPersistedPurchaseLine(purchaseLine)
        );
    }

    @Test
    @Transactional
    void fullUpdatePurchaseLineWithPatch() throws Exception {
        // Initialize the database
        insertedPurchaseLine = purchaseLineRepository.saveAndFlush(purchaseLine);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the purchaseLine using partial update
        PurchaseLine partialUpdatedPurchaseLine = new PurchaseLine();
        partialUpdatedPurchaseLine.setId(purchaseLine.getId());

        partialUpdatedPurchaseLine
            .name(UPDATED_NAME)
            .qty(UPDATED_QTY)
            .unit(UPDATED_UNIT)
            .rate(UPDATED_RATE)
            .discountKind(UPDATED_DISCOUNT_KIND)
            .discountValue(UPDATED_DISCOUNT_VALUE)
            .taxPercent(UPDATED_TAX_PERCENT)
            .lineOrder(UPDATED_LINE_ORDER);

        restPurchaseLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPurchaseLine.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPurchaseLine))
            )
            .andExpect(status().isOk());

        // Validate the PurchaseLine in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPurchaseLineUpdatableFieldsEquals(partialUpdatedPurchaseLine, getPersistedPurchaseLine(partialUpdatedPurchaseLine));
    }

    @Test
    @Transactional
    void patchNonExistingPurchaseLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchaseLine.setId(longCount.incrementAndGet());

        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPurchaseLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, purchaseLineDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(purchaseLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPurchaseLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchaseLine.setId(longCount.incrementAndGet());

        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseLineMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(purchaseLineDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPurchaseLine() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        purchaseLine.setId(longCount.incrementAndGet());

        // Create the PurchaseLine
        PurchaseLineDTO purchaseLineDTO = purchaseLineMapper.toDto(purchaseLine);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPurchaseLineMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(purchaseLineDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the PurchaseLine in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePurchaseLine() throws Exception {
        // Initialize the database
        insertedPurchaseLine = purchaseLineRepository.saveAndFlush(purchaseLine);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the purchaseLine
        restPurchaseLineMockMvc
            .perform(delete(ENTITY_API_URL_ID, purchaseLine.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return purchaseLineRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected PurchaseLine getPersistedPurchaseLine(PurchaseLine purchaseLine) {
        return purchaseLineRepository.findById(purchaseLine.getId()).orElseThrow();
    }

    protected void assertPersistedPurchaseLineToMatchAllProperties(PurchaseLine expectedPurchaseLine) {
        assertPurchaseLineAllPropertiesEquals(expectedPurchaseLine, getPersistedPurchaseLine(expectedPurchaseLine));
    }

    protected void assertPersistedPurchaseLineToMatchUpdatableProperties(PurchaseLine expectedPurchaseLine) {
        assertPurchaseLineAllUpdatablePropertiesEquals(expectedPurchaseLine, getPersistedPurchaseLine(expectedPurchaseLine));
    }
}
