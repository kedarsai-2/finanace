package com.finance.app.service;

import com.finance.app.domain.InvoiceLine;
import com.finance.app.repository.InvoiceLineRepository;
import com.finance.app.service.dto.InvoiceLineDTO;
import com.finance.app.service.mapper.InvoiceLineMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.InvoiceLine}.
 */
@Service
@Transactional
public class InvoiceLineService {

    private static final Logger LOG = LoggerFactory.getLogger(InvoiceLineService.class);

    private final InvoiceLineRepository invoiceLineRepository;

    private final InvoiceLineMapper invoiceLineMapper;

    public InvoiceLineService(InvoiceLineRepository invoiceLineRepository, InvoiceLineMapper invoiceLineMapper) {
        this.invoiceLineRepository = invoiceLineRepository;
        this.invoiceLineMapper = invoiceLineMapper;
    }

    /**
     * Save a invoiceLine.
     *
     * @param invoiceLineDTO the entity to save.
     * @return the persisted entity.
     */
    public InvoiceLineDTO save(InvoiceLineDTO invoiceLineDTO) {
        LOG.debug("Request to save InvoiceLine : {}", invoiceLineDTO);
        InvoiceLine invoiceLine = invoiceLineMapper.toEntity(invoiceLineDTO);
        invoiceLine = invoiceLineRepository.save(invoiceLine);
        return invoiceLineMapper.toDto(invoiceLine);
    }

    /**
     * Update a invoiceLine.
     *
     * @param invoiceLineDTO the entity to save.
     * @return the persisted entity.
     */
    public InvoiceLineDTO update(InvoiceLineDTO invoiceLineDTO) {
        LOG.debug("Request to update InvoiceLine : {}", invoiceLineDTO);
        InvoiceLine invoiceLine = invoiceLineMapper.toEntity(invoiceLineDTO);
        invoiceLine = invoiceLineRepository.save(invoiceLine);
        return invoiceLineMapper.toDto(invoiceLine);
    }

    /**
     * Partially update a invoiceLine.
     *
     * @param invoiceLineDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<InvoiceLineDTO> partialUpdate(InvoiceLineDTO invoiceLineDTO) {
        LOG.debug("Request to partially update InvoiceLine : {}", invoiceLineDTO);

        return invoiceLineRepository
            .findById(invoiceLineDTO.getId())
            .map(existingInvoiceLine -> {
                invoiceLineMapper.partialUpdate(existingInvoiceLine, invoiceLineDTO);

                return existingInvoiceLine;
            })
            .map(invoiceLineRepository::save)
            .map(invoiceLineMapper::toDto);
    }

    /**
     * Get all the invoiceLines.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<InvoiceLineDTO> findAll() {
        LOG.debug("Request to get all InvoiceLines");
        return invoiceLineRepository.findAll().stream().map(invoiceLineMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the invoiceLines with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<InvoiceLineDTO> findAllWithEagerRelationships(Pageable pageable) {
        return invoiceLineRepository.findAllWithEagerRelationships(pageable).map(invoiceLineMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<InvoiceLineDTO> findAllByInvoiceId(Long invoiceId) {
        LOG.debug("Request to get InvoiceLines by invoiceId: {}", invoiceId);
        return invoiceLineRepository
            .findAllByInvoiceIdWithItem(invoiceId)
            .stream()
            .map(invoiceLineMapper::toDto)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get one invoiceLine by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<InvoiceLineDTO> findOne(Long id) {
        LOG.debug("Request to get InvoiceLine : {}", id);
        return invoiceLineRepository.findOneWithEagerRelationships(id).map(invoiceLineMapper::toDto);
    }

    /**
     * Delete the invoiceLine by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete InvoiceLine : {}", id);
        invoiceLineRepository.deleteById(id);
    }
}
