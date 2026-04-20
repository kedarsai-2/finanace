package com.finance.app.web.rest;

import static com.finance.app.domain.PaymentAllocationAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Payment;
import com.finance.app.domain.PaymentAllocation;
import com.finance.app.repository.PaymentAllocationRepository;
import com.finance.app.service.dto.PaymentAllocationDTO;
import com.finance.app.service.mapper.PaymentAllocationMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link PaymentAllocationResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class PaymentAllocationResourceIT {

    private static final String DEFAULT_DOC_ID = "AAAAAAAAAA";
    private static final String UPDATED_DOC_ID = "BBBBBBBBBB";

    private static final String DEFAULT_DOC_NUMBER = "AAAAAAAAAA";
    private static final String UPDATED_DOC_NUMBER = "BBBBBBBBBB";

    private static final BigDecimal DEFAULT_AMOUNT = new BigDecimal(0);
    private static final BigDecimal UPDATED_AMOUNT = new BigDecimal(1);

    private static final String ENTITY_API_URL = "/api/payment-allocations";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private PaymentAllocationMapper paymentAllocationMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPaymentAllocationMockMvc;

    private PaymentAllocation paymentAllocation;

    private PaymentAllocation insertedPaymentAllocation;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PaymentAllocation createEntity(EntityManager em) {
        PaymentAllocation paymentAllocation = new PaymentAllocation()
            .docId(DEFAULT_DOC_ID)
            .docNumber(DEFAULT_DOC_NUMBER)
            .amount(DEFAULT_AMOUNT);
        // Add required entity
        Payment payment;
        if (TestUtil.findAll(em, Payment.class).isEmpty()) {
            payment = PaymentResourceIT.createEntity();
            em.persist(payment);
            em.flush();
        } else {
            payment = TestUtil.findAll(em, Payment.class).get(0);
        }
        paymentAllocation.setPayment(payment);
        return paymentAllocation;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static PaymentAllocation createUpdatedEntity(EntityManager em) {
        PaymentAllocation updatedPaymentAllocation = new PaymentAllocation()
            .docId(UPDATED_DOC_ID)
            .docNumber(UPDATED_DOC_NUMBER)
            .amount(UPDATED_AMOUNT);
        // Add required entity
        Payment payment;
        if (TestUtil.findAll(em, Payment.class).isEmpty()) {
            payment = PaymentResourceIT.createUpdatedEntity();
            em.persist(payment);
            em.flush();
        } else {
            payment = TestUtil.findAll(em, Payment.class).get(0);
        }
        updatedPaymentAllocation.setPayment(payment);
        return updatedPaymentAllocation;
    }

    @BeforeEach
    void initTest() {
        paymentAllocation = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedPaymentAllocation != null) {
            paymentAllocationRepository.delete(insertedPaymentAllocation);
            insertedPaymentAllocation = null;
        }
    }

    @Test
    @Transactional
    void createPaymentAllocation() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);
        var returnedPaymentAllocationDTO = om.readValue(
            restPaymentAllocationMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(paymentAllocationDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PaymentAllocationDTO.class
        );

        // Validate the PaymentAllocation in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPaymentAllocation = paymentAllocationMapper.toEntity(returnedPaymentAllocationDTO);
        assertPaymentAllocationUpdatableFieldsEquals(returnedPaymentAllocation, getPersistedPaymentAllocation(returnedPaymentAllocation));

        insertedPaymentAllocation = returnedPaymentAllocation;
    }

    @Test
    @Transactional
    void createPaymentAllocationWithExistingId() throws Exception {
        // Create the PaymentAllocation with an existing ID
        paymentAllocation.setId(1L);
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPaymentAllocationMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(paymentAllocationDTO)))
            .andExpect(status().isBadRequest());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkDocIdIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        paymentAllocation.setDocId(null);

        // Create the PaymentAllocation, which fails.
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        restPaymentAllocationMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(paymentAllocationDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDocNumberIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        paymentAllocation.setDocNumber(null);

        // Create the PaymentAllocation, which fails.
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        restPaymentAllocationMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(paymentAllocationDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        paymentAllocation.setAmount(null);

        // Create the PaymentAllocation, which fails.
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        restPaymentAllocationMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(paymentAllocationDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPaymentAllocations() throws Exception {
        // Initialize the database
        insertedPaymentAllocation = paymentAllocationRepository.saveAndFlush(paymentAllocation);

        // Get all the paymentAllocationList
        restPaymentAllocationMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(paymentAllocation.getId().intValue())))
            .andExpect(jsonPath("$.[*].docId").value(hasItem(DEFAULT_DOC_ID)))
            .andExpect(jsonPath("$.[*].docNumber").value(hasItem(DEFAULT_DOC_NUMBER)))
            .andExpect(jsonPath("$.[*].amount").value(hasItem(sameNumber(DEFAULT_AMOUNT))));
    }

    @Test
    @Transactional
    void getPaymentAllocation() throws Exception {
        // Initialize the database
        insertedPaymentAllocation = paymentAllocationRepository.saveAndFlush(paymentAllocation);

        // Get the paymentAllocation
        restPaymentAllocationMockMvc
            .perform(get(ENTITY_API_URL_ID, paymentAllocation.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(paymentAllocation.getId().intValue()))
            .andExpect(jsonPath("$.docId").value(DEFAULT_DOC_ID))
            .andExpect(jsonPath("$.docNumber").value(DEFAULT_DOC_NUMBER))
            .andExpect(jsonPath("$.amount").value(sameNumber(DEFAULT_AMOUNT)));
    }

    @Test
    @Transactional
    void getNonExistingPaymentAllocation() throws Exception {
        // Get the paymentAllocation
        restPaymentAllocationMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPaymentAllocation() throws Exception {
        // Initialize the database
        insertedPaymentAllocation = paymentAllocationRepository.saveAndFlush(paymentAllocation);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the paymentAllocation
        PaymentAllocation updatedPaymentAllocation = paymentAllocationRepository.findById(paymentAllocation.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPaymentAllocation are not directly saved in db
        em.detach(updatedPaymentAllocation);
        updatedPaymentAllocation.docId(UPDATED_DOC_ID).docNumber(UPDATED_DOC_NUMBER).amount(UPDATED_AMOUNT);
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(updatedPaymentAllocation);

        restPaymentAllocationMockMvc
            .perform(
                put(ENTITY_API_URL_ID, paymentAllocationDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(paymentAllocationDTO))
            )
            .andExpect(status().isOk());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPaymentAllocationToMatchAllProperties(updatedPaymentAllocation);
    }

    @Test
    @Transactional
    void putNonExistingPaymentAllocation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        paymentAllocation.setId(longCount.incrementAndGet());

        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPaymentAllocationMockMvc
            .perform(
                put(ENTITY_API_URL_ID, paymentAllocationDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(paymentAllocationDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPaymentAllocation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        paymentAllocation.setId(longCount.incrementAndGet());

        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPaymentAllocationMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(paymentAllocationDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPaymentAllocation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        paymentAllocation.setId(longCount.incrementAndGet());

        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPaymentAllocationMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(paymentAllocationDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePaymentAllocationWithPatch() throws Exception {
        // Initialize the database
        insertedPaymentAllocation = paymentAllocationRepository.saveAndFlush(paymentAllocation);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the paymentAllocation using partial update
        PaymentAllocation partialUpdatedPaymentAllocation = new PaymentAllocation();
        partialUpdatedPaymentAllocation.setId(paymentAllocation.getId());

        partialUpdatedPaymentAllocation.docNumber(UPDATED_DOC_NUMBER).amount(UPDATED_AMOUNT);

        restPaymentAllocationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPaymentAllocation.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPaymentAllocation))
            )
            .andExpect(status().isOk());

        // Validate the PaymentAllocation in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPaymentAllocationUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedPaymentAllocation, paymentAllocation),
            getPersistedPaymentAllocation(paymentAllocation)
        );
    }

    @Test
    @Transactional
    void fullUpdatePaymentAllocationWithPatch() throws Exception {
        // Initialize the database
        insertedPaymentAllocation = paymentAllocationRepository.saveAndFlush(paymentAllocation);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the paymentAllocation using partial update
        PaymentAllocation partialUpdatedPaymentAllocation = new PaymentAllocation();
        partialUpdatedPaymentAllocation.setId(paymentAllocation.getId());

        partialUpdatedPaymentAllocation.docId(UPDATED_DOC_ID).docNumber(UPDATED_DOC_NUMBER).amount(UPDATED_AMOUNT);

        restPaymentAllocationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPaymentAllocation.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPaymentAllocation))
            )
            .andExpect(status().isOk());

        // Validate the PaymentAllocation in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPaymentAllocationUpdatableFieldsEquals(
            partialUpdatedPaymentAllocation,
            getPersistedPaymentAllocation(partialUpdatedPaymentAllocation)
        );
    }

    @Test
    @Transactional
    void patchNonExistingPaymentAllocation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        paymentAllocation.setId(longCount.incrementAndGet());

        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPaymentAllocationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, paymentAllocationDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(paymentAllocationDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPaymentAllocation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        paymentAllocation.setId(longCount.incrementAndGet());

        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPaymentAllocationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(paymentAllocationDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPaymentAllocation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        paymentAllocation.setId(longCount.incrementAndGet());

        // Create the PaymentAllocation
        PaymentAllocationDTO paymentAllocationDTO = paymentAllocationMapper.toDto(paymentAllocation);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPaymentAllocationMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(paymentAllocationDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the PaymentAllocation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePaymentAllocation() throws Exception {
        // Initialize the database
        insertedPaymentAllocation = paymentAllocationRepository.saveAndFlush(paymentAllocation);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the paymentAllocation
        restPaymentAllocationMockMvc
            .perform(delete(ENTITY_API_URL_ID, paymentAllocation.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return paymentAllocationRepository.count();
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

    protected PaymentAllocation getPersistedPaymentAllocation(PaymentAllocation paymentAllocation) {
        return paymentAllocationRepository.findById(paymentAllocation.getId()).orElseThrow();
    }

    protected void assertPersistedPaymentAllocationToMatchAllProperties(PaymentAllocation expectedPaymentAllocation) {
        assertPaymentAllocationAllPropertiesEquals(expectedPaymentAllocation, getPersistedPaymentAllocation(expectedPaymentAllocation));
    }

    protected void assertPersistedPaymentAllocationToMatchUpdatableProperties(PaymentAllocation expectedPaymentAllocation) {
        assertPaymentAllocationAllUpdatablePropertiesEquals(
            expectedPaymentAllocation,
            getPersistedPaymentAllocation(expectedPaymentAllocation)
        );
    }
}
